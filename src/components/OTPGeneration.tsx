import React, { useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';

interface OTPGenerationProps {
  onGenerate: (type: 'single' | 'group') => void;
  onBack: () => void;
}

export const OTPGeneration: React.FC<OTPGenerationProps> = ({ onGenerate, onBack }) => {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back
      </button>
      
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
        Choose Chat Type
      </h2>
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <button
          onClick={() => onGenerate('single')}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Single Chat (1-on-1)
        </button>
        
        <button
          onClick={() => onGenerate('group')}
          className="flex items-center justify-center gap-3 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Users className="w-5 h-5" />
          Group Chat
        </button>
      </div>
    </div>
  );
};