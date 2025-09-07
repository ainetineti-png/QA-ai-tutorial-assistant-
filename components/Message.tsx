
import React from 'react';
import { ChatMessage } from '../types';
import SourcePill from './SourcePill';
import { SparklesIcon } from './icons/SparklesIcon';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) { // It's a code block
        return (
          <pre key={index} className="bg-gray-900 rounded-md p-4 my-2 overflow-x-auto">
            <code className="text-sm font-mono text-green-300">{part}</code>
          </pre>
        );
      }
      // It's regular text, split by newlines to preserve them
      return part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-2xl p-4 rounded-2xl ${
          isUser
            ? 'bg-accent-blue text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <div className="prose prose-invert prose-sm max-w-none">
            {formatContent(message.content)}
            {message.content === '' && (
                 <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mx-1"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mx-1 delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mx-1 delay-300"></div>
                </div>
            )}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <h4 className="text-xs font-semibold mb-2 text-gray-400">Sources:</h4>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <SourcePill key={index} source={source} index={index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
