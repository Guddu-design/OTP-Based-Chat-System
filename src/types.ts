export interface ChatRoom {
  id: string;
  type: 'single' | 'group';
  created_at: string;
  otp: string;
  expires_at: string;
  active_participants: number;
  last_activity: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  username: string;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  retry?: () => Promise<void>;
}

export interface ChatState {
  currentRoom: ChatRoom | null;
  messages: Message[];
  username: string;
  isConnected: boolean;
  typingUsers: Set<string>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setMessages: (messages: Message[]) => void;
  setUsername: (username: string) => void;
  setIsConnected: (status: boolean) => void;
  setTypingUsers: (users: Set<string>) => void;
}