import React, { useState } from 'react';
import { OTPSelection } from './components/OTPSelection';
import { OTPGeneration } from './components/OTPGeneration';
import { OTPEntry } from './components/OTPEntry';
import { ChatRoom } from './components/ChatRoom';
import { UsernameEntry } from './components/UsernameEntry';
import { useChatStore } from './store/chatStore';
import { generateOTP, joinRoom } from './lib/supabase';

type Step = 'username' | 'selection' | 'generation' | 'entry' | 'chat';

function App() {
  const [step, setStep] = useState<Step>('username');
  const { currentRoom, setCurrentRoom, setUsername, username } = useChatStore();
  const [error, setError] = useState<string>('');

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setStep('selection');
  };

  const handleOTPGenerate = async (type: 'single' | 'group') => {
    try {
      setError('');
      const room = await generateOTP(type);
      setCurrentRoom(room);
      setStep('chat');
    } catch (err) {
      setError('Failed to generate OTP. Please try again.');
      console.error('Error generating OTP:', err);
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    try {
      setError('');
      const room = await joinRoom(otp);
      setCurrentRoom(room);
      setStep('chat');
    } catch (err) {
      setError('Invalid or expired OTP. Please check and try again.');
      console.error('Error joining room:', err);
    }
  };

  if (!username && step !== 'username') {
    return <UsernameEntry onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {step === 'username' && (
          <UsernameEntry onSubmit={handleUsernameSubmit} />
        )}
        
        {step === 'selection' && (
          <OTPSelection
            onSelect={(type) => setStep(type === 'generate' ? 'generation' : 'entry')}
          />
        )}
        
        {step === 'generation' && (
          <OTPGeneration
            onGenerate={handleOTPGenerate}
            onBack={() => setStep('selection')}
          />
        )}
        
        {step === 'entry' && (
          <OTPEntry
            onSubmit={handleOTPSubmit}
            onBack={() => setStep('selection')}
          />
        )}
        
        {step === 'chat' && currentRoom && <ChatRoom />}
      </div>
    </div>
  );
}

export default App;