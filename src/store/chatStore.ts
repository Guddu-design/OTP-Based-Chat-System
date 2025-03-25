import { create } from 'zustand';
import { ChatState } from '../types';

export const useChatStore = create<ChatState>((set) => ({
  currentRoom: null,
  messages: [],
  username: '',
  isConnected: true,
  typingUsers: new Set(),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  setMessages: (messages) => set({ messages }),
  setUsername: (username) => set({ username }),
  setIsConnected: (status) => set({ isConnected: status }),
  setTypingUsers: (users) => set({ typingUsers: users })
}));