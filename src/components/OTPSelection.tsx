import React from 'react';
import { MessageSquare, Users } from 'lucide-react';

interface OTPSelectionProps {
  onSelect: (type: 'generate' | 'enter') => void;
}

export const OTPSelection: React.FC<OTPSelectionProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
        Anonymous Chat
      </h1>
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <button
          onClick={() => onSelect('generate')}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Generate New OTP
        </button>
        
        <button
          onClick={() => onSelect('enter')}
          className="flex items-center justify-center gap-3 bg-gray-100 text-gray-900 px-6 py-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Users className="w-5 h-5" />
          Enter Existing OTP
        </button>
      </div>
    </div>
  );
};