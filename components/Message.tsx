
import React from 'react';
import { ChatMessage, ResourceLinkInfo } from '../types';
import SourcePill from './SourcePill';
import ResourceLink from './ResourceLink';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';

interface MessageProps {
  message: ChatMessage;
  onKeywordVideoSearch: (keyword: string) => void;
}

const parseLinks = (text: string): ResourceLinkInfo[] => {
  const linkRegex = /\*\s*\[([^\]]+)\]\(([^)]+)\)/g;
  const links: ResourceLinkInfo[] = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({ title: match[1], url: match[2] });
  }
  return links;
};

const Message: React.FC<MessageProps> = ({ message, onKeywordVideoSearch }) => {
  const isUser = message.role === 'user';

  const formatMainContent = (content: string) => {
    if (isUser) {
        return content;
    }
    const keywordRegex = /\[\[([^\]]+)\]\]/g;
    const parts = content.split(keywordRegex);
  
    return parts.map((part, index) => {
      if (index % 2 === 1) { // It's a keyword
        return (
          <button
            key={index}
            onClick={() => onKeywordVideoSearch(part)}
            className="inline-flex items-center bg-blue-900/50 hover:bg-accent-blue text-blue-300 hover:text-white font-medium px-2 py-0.5 rounded-md transition-all duration-200 text-sm mx-1 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <PlayIcon className="w-3 h-3 mr-1.5" />
            {part}
          </button>
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

  const sections = message.content.split(/(### Further Reading|### Explanatory Videos)/);
  let mainContent = sections[0];

  let furtherReadingText = '';
  let explanatoryVideosText = '';

  for (let i = 1; i < sections.length; i += 2) {
    if (sections[i] === '### Further Reading') {
      furtherReadingText = sections[i+1];
    } else if (sections[i] === '### Explanatory Videos') {
      explanatoryVideosText = sections[i+1];
    }
  }

  const furtherReadingLinks = parseLinks(furtherReadingText);
  const videoLinks = parseLinks(explanatoryVideosText);
  
  // Clean main content from the sections we parsed out.
  mainContent = mainContent.replace(/### Further Reading[\s\S]*/, '').replace(/### Explanatory Videos[\s\S]*/, '').trim();

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
        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
            {formatMainContent(mainContent)}
            {message.content === '' && (
                 <div className="flex items-center text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-gray-500 mr-3"></div>
                    <span>Processing your request...</span>
                </div>
            )}
        </div>
        
        {furtherReadingLinks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">Further Reading</h4>
            <div className="flex flex-col space-y-2">
              {furtherReadingLinks.map((link, index) => (
                <ResourceLink key={index} link={link} type="website" />
              ))}
            </div>
          </div>
        )}

        {videoLinks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">Explanatory Videos</h4>
            <div className="flex flex-col space-y-2">
              {videoLinks.map((link, index) => (
                <ResourceLink key={index} link={link} type="youtube" />
              ))}
            </div>
          </div>
        )}

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
