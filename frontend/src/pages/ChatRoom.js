import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatRoom() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-eggshell flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#787A91] mb-4">Chat room coming soon</p>
        <button onClick={() => navigate('/chats')} className="text-clay font-semibold hover:underline">
          Back to Chats
        </button>
      </div>
    </div>
  );
}
