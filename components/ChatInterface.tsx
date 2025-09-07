
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import Message from './Message';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  error: string | null;
  onKeywordVideoSearch: (keyword: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, error, onKeywordVideoSearch }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full animate-slide-in-bottom">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="flex flex-col space-y-6">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} onKeywordVideoSearch={onKeywordVideoSearch} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <div className="relative flex items-center bg-gray-700 rounded-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="w-full bg-transparent p-3 pr-16 text-gray-200 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue rounded-lg"
            rows={1}
            style={{ maxHeight: '100px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-accent-blue hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
