import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function Chats() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-eggshell">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <button onClick={() => navigate('/dashboard')} className="text-clay font-semibold mb-6 hover:underline">
          ← Back to Dashboard
        </button>

        <h1 className="font-heading text-4xl font-bold text-deepblue mb-8">
          Messages
        </h1>

        <div className="bg-white rounded-3xl p-12 text-center shadow-soft">
          <MessageCircle className="w-16 h-16 text-[#787A91] mx-auto mb-4" />
          <p className="text-[#787A91]">Chat feature coming soon!</p>
        </div>
      </div>
    </div>
  );
}
