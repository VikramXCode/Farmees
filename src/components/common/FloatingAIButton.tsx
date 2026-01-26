import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingAIButtonProps {
  onClick?: () => void;
}

export default function FloatingAIButton({ onClick }: FloatingAIButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/ai');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-br from-farm-primary-500 to-farm-primary-700 text-white rounded-full shadow-fab flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      aria-label="Ask AI Assistant"
    >
      <div className="relative">
        <MessageSquare className="w-6 h-6" />
        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-farm-accent-300" />
      </div>
    </button>
  );
}
