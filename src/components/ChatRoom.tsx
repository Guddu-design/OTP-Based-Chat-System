import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { formatDistanceToNow } from '../utils/date';
import { sendMessage, subscribeToMessages, fetchMessages } from '../lib/supabase';

export const ChatRoom: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);
  
  const {
    currentRoom,
    messages,
    username,
    isConnected,
    typingUsers,
    addMessage,
    setMessages,
    updateMessage,
    setIsConnected,
    setTypingUsers
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentRoom) return;

    let retryInterval: NodeJS.Timeout;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const existingMessages = await fetchMessages(currentRoom.id);
        setMessages(existingMessages);

        subscriptionRef.current = subscribeToMessages(
          currentRoom.id,
          (payload) => {
            if (payload.new) {
              addMessage({ ...payload.new, status: 'delivered' });
            }
          },
          (typingUsername) => {
            setTypingUsers(new Set(
              typingUsername ? 
                [...typingUsers].concat(typingUsername) :
                [...typingUsers].filter(u => u !== typingUsername)
            ));
          },
          (count) => {
            // Handle participant count updates
          }
        );

        setIsConnected(true);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Connection lost. Retrying...');
        setIsConnected(false);
        
        // Retry connection every 5 seconds
        retryInterval = setInterval(initializeChat, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (subscriptionRef.current?.unsubscribe) {
        subscriptionRef.current.unsubscribe();
      }
      clearInterval(retryInterval);
    };
  }, [currentRoom, setMessages, addMessage, setIsConnected, typingUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentRoom || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      room_id: currentRoom.id,
      content: message.trim(),
      username,
      created_at: new Date().toISOString(),
      status: 'sending' as const,
      sender_id: null
    };

    try {
      setIsSending(true);
      setError('');
      addMessage(tempMessage);
      setMessage('');
      scrollToBottom();

      const sentMessage = await sendMessage(
        currentRoom.id,
        tempMessage.content,
        username,
        (status) => updateMessage(tempId, { status })
      );

      updateMessage(tempId, { 
        id: sentMessage.id,
        status: 'delivered'
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      updateMessage(tempId, { 
        status: 'error',
        retry: () => handleSubmit(e)
      });
      setError('Failed to send message. Click to retry.');
    } finally {
      setIsSending(false);
    }
  };

  if (!currentRoom) return null;

  const expiryTime = new Date(currentRoom.expires_at);
  const timeLeft = formatDistanceToNow(expiryTime);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {currentRoom.type === 'single' ? 'Private Chat' : 'Group Chat'}
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Expires in {timeLeft}
          </p>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-gray-700">
            OTP: {currentRoom.otp}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.username === username 
                    ? 'bg-yellow-400 text-gray-900' 
                    : 'bg-green-500 text-white'
                }`}
              >
                {msg.username !== username && (
                  <p className="text-xs font-medium mb-1 opacity-90">{msg.username}</p>
                )}
                <p className="break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-xs ${
                    msg.username === username ? 'text-gray-700' : 'text-white/80'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                  {msg.username === username && (
                    <span className="ml-1">
                      {msg.status === 'sending' && (
                        <Clock className="w-3 h-3 text-gray-700" />
                      )}
                      {msg.status === 'sent' && (
                        <CheckCircle2 className="w-3 h-3 text-gray-700" />
                      )}
                      {msg.status === 'delivered' && (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      )}
                      {msg.status === 'error' && (
                        <XCircle 
                          className="w-3 h-3 text-red-500 cursor-pointer"
                          onClick={() => msg.retry?.()}
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {typingUsers.size > 0 && (
          <div className="text-sm text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              subscriptionRef.current?.sendTyping(username);
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            disabled={!isConnected || isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected || isSending}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};