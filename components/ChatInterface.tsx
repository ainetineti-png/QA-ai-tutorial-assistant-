import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import Message from './Message';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  error: string | null;
  onExplainFurther: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, error, onExplainFurther }) => {
  const [input, setInput] = useState('');
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const scrollContainer = scrollableContainerRef.current;

    if (scrollContainer) {
      // Determine if the user was scrolled to the bottom before the new message/chunk arrived.
      // This check runs *after* the DOM has updated. If the distance from the bottom is less
      // than a certain threshold, we assume they were at the bottom and want to stay there.
      const scrollThreshold = 200; // Generous buffer in pixels
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < scrollThreshold;

      // Only auto-scroll if the user is following the chat at the bottom.
      // This prevents hijacking the scroll position if they've scrolled up to read past messages.
      if (isAtBottom) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);


  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Temporarily shrink to get the correct scrollHeight
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height in pixels
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      // Focus after send, and the useEffect above will resize it back to its initial state
      inputRef.current?.focus(); 
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
      <div ref={scrollableContainerRef} className="flex-grow p-6 overflow-y-auto">
        <div className="flex flex-col space-y-6">
          {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              // Show explain button only on the last message, if it's from the AI and fully loaded.
              const showExplainButton = msg.role === 'ai' && msg.content && !isLoading && isLastMessage;

              return (
                <Message
                  key={msg.id}
                  message={msg}
                  onExplainFurther={showExplainButton ? onExplainFurther : undefined}
                />
              );
            })}
        </div>
      </div>
      <div className="p-4 border-t border-white/10">
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <div className="relative flex items-center bg-gray-800 rounded-xl border border-gray-700 focus-within:border-accent-blue focus-within:shadow-[0_0_0_2px_theme(colors.accent-blue/40%)] transition-all duration-300 focus-within:animate-focus-pulse">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="w-full bg-transparent p-3 pr-14 text-gray-200 placeholder-gray-500 resize-none focus:outline-none rounded-xl"
            rows={1} // Keep rows={1} for initial height, effect will handle resizing
            style={{ overflowY: 'hidden' }} // Start with hidden overflow
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-white bg-accent-blue hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 group"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-0.5">
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></span>
              </div>
            ) : (
              <SendIcon className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;