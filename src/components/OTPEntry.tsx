import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface OTPEntryProps {
  onSubmit: (otp: string) => void;
  onBack: () => void;
}

export const OTPEntry: React.FC<OTPEntryProps> = ({ onSubmit, onBack }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length === 6) {
      try {
        await onSubmit(otp);
      } catch (err: any) {
        // Display a more user-friendly error message
        if (err.message.includes('already in use')) {
          setError('This private chat room is already in use. Please try a different OTP or create a new room.');
        } else if (err.message.includes('Invalid OTP')) {
          setError('Invalid OTP or the room has expired. Please check and try again.');
        } else {
          setError('An error occurred. Please try again.');
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back
      </button>
      
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Enter OTP
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={otp.length !== 6}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};