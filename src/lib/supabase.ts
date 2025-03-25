import { createClient } from '@supabase/supabase-js';
import { get, set } from 'idb-keyval';
import { Message } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache messages locally
async function cacheMessages(roomId: string, messages: Message[]) {
  await set(`messages:${roomId}`, messages);
}

async function getCachedMessages(roomId: string): Promise<Message[]> {
  return await get(`messages:${roomId}`) || [];
}

export async function generateOTP(type: 'single' | 'group') {
  try {
    const otp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4);

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        type,
        otp,
        expires_at: expiresAt.toISOString(),
        active_participants: 1,
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return room;
  } catch (err) {
    console.error('Error in generateOTP:', err);
    throw new Error('Failed to generate OTP');
  }
}

export async function joinRoom(otp: string) {
  try {
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select()
      .eq('otp', otp)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error) throw new Error('Invalid OTP or room has expired');

    // Update active participants
    await supabase
      .from('chat_rooms')
      .update({ 
        active_participants: room.active_participants + 1,
        last_activity: new Date().toISOString()
      })
      .eq('id', room.id);

    return room;
  } catch (err) {
    console.error('Error joining room:', err);
    throw err;
  }
}

export async function fetchMessages(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    const messages = data || [];
    await cacheMessages(roomId, messages);
    return messages;
  } catch (err) {
    console.error('Error fetching messages:', err);
    return await getCachedMessages(roomId);
  }
}

export async function sendMessage(
  roomId: string,
  content: string,
  username: string,
  onProgress: (status: Message['status']) => void
) {
  try {
    onProgress('sending');
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        content,
        username,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update room activity
    await supabase
      .from('chat_rooms')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', roomId);

    onProgress('sent');
    setTimeout(() => onProgress('delivered'), 500);
    return data;
  } catch (err) {
    console.error('Error sending message:', err);
    onProgress('error');
    throw err;
  }
}

let typingTimeout: NodeJS.Timeout;

export function subscribeToMessages(
  roomId: string, 
  onMessage: (payload: any) => void,
  onTyping: (username: string) => void,
  onPresence: (count: number) => void
) {
  const channel = supabase.channel(`room:${roomId}`);

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const count = Object.keys(presenceState).length;
      onPresence(count);
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      onMessage
    )
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      onTyping(payload.username);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

  const sendTypingIndicator = (username: string) => {
    clearTimeout(typingTimeout);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { username }
    });
    typingTimeout = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { username: '' }
      });
    }, 1000);
  };

  return {
    unsubscribe: () => {
      channel.unsubscribe();
      clearTimeout(typingTimeout);
    },
    sendTyping: sendTypingIndicator
  };
}