
import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 py-2 px-1">
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
  </div>
);