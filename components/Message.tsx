import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage } from '../types';
import SourcePill from './SourcePill';
import ResourceLink from './ResourceLink';
import { SparklesIcon } from './icons/SparklesIcon';
import { TypingIndicator } from './TypingIndicator';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { parseContent } from '../utils/contentParser';
import { useChat } from '../contexts/ChatContext';

interface MessageProps {
  message: ChatMessage;
  onExplainFurther?: () => void;
}

const preprocessKeywords = (text: string): string => {
  return text.replace(/\[\[([^\]]+)\]\]/g, '[$1](video://$1)');
};

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative group">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={isCopied ? 'Copied' : 'Copy code'}
            >
                {isCopied ? <CheckIcon className="w-4 h-4 text-accent-green" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
            <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
                {String(value).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

const Message: React.FC<MessageProps> = ({ message, onExplainFurther }) => {
  const { onKeywordVideoSearch } = useChat();
  const isUser = message.role === 'user';

  const { sections, furtherReadingLinks, videoLinks } = useMemo(() => {
    // While streaming, or if content is still empty, treat all content as a single 'summary' block.
    // This prevents expensive parsing on every incoming chunk.
    if (message.isStreaming || !message.content) {
        return {
            // FIX: Cast sections to a generic string-keyed object to unify the type.
            // This allows accessing optional sections like 'detailedexplanation' without TypeScript errors,
            // as they will correctly resolve to `undefined` during streaming.
            sections: { summary: message.content || '' } as { [key: string]: string },
            furtherReadingLinks: [],
            videoLinks: [],
        };
    }
    // Once streaming is done, parse the final content.
    return parseContent(message.content);
  }, [message.content, message.isStreaming]);

  const components = {
      a: ({node, ...props}) => {
          if (props.href?.startsWith('video://')) {
              const keyword = props.href.substring(8);
              return (
                  <button
                      onClick={() => onKeywordVideoSearch(keyword)}
                      className="inline-block relative text-blue-300 hover:text-blue-200 font-medium transition-colors duration-200 mx-1 px-0.5 py-0 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-sm group align-baseline"
                      aria-label={`Find video for ${keyword}`}
                  >
                      {props.children}
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-blue-400/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300 ease-out"></span>
                      <span className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-blue-400 blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300"></span>
                  </button>
              );
          }
          return <a {...props} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{props.children}</a>
      },
      table: ({node, ...props}) => <table className="table-auto border-collapse border border-gray-600 w-full" {...props} />,
      thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
      th: ({node, ...props}) => <th className="border border-gray-600 px-4 py-2 text-left" {...props} />,
      td: ({node, ...props}) => <td className="border border-gray-600 px-4 py-2" {...props} />,
      pre: ({node, ...props}) => <div className="my-2">{props.children}</div>,
      code({ node, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
          <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
        ) : (
          <code className="bg-gray-900/50 text-gray-300 rounded-md px-1.5 py-1 font-mono text-sm" {...props}>
            {children}
          </code>
        );
      },
  };

  const renderContent = (text: string) => (
      <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={components}
      >
          {preprocessKeywords(text)}
      </ReactMarkdown>
  );

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`relative max-w-2xl p-4 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg'
            : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 rounded-bl-none border border-white/10 shadow-xl'
        }`}
      >
        {!isUser && (
           <div 
            className="absolute inset-0 rounded-2xl border border-white/10 opacity-50 overflow-hidden [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]">
            <div 
              className="absolute inset-[-1000%] animate-shimmer bg-[linear-gradient(110deg,#0001,45%,#111,55%,#0001)] bg-[length:200%_100%]">
            </div>
          </div>
        )}
        <div className="relative z-10">
            <div className="prose prose-invert prose-sm max-w-none leading-loose markdown-content">
                {isUser ? (
                    renderContent(message.content)
                ) : message.content === '' ? (
                    <TypingIndicator />
                ) : (
                    <>
                        {/* The 'summary' section will contain the full text during streaming */}
                        {renderContent(sections.summary)}
                        
                        {/* Only render the other sections after streaming is complete */}
                        {!message.isStreaming && sections.detailedexplanation && (
                             <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                {renderContent(sections.detailedexplanation)}
                            </div>
                        )}
                        
                        {!message.isStreaming && sections.indepthanalysis && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                {renderContent(sections.indepthanalysis)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {onExplainFurther && (
              <div className="mt-4 flex justify-start">
                  <button
                      onClick={onExplainFurther}
                      className="px-5 py-2.5 bg-accent-blue hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 animate-fade-in"
                  >
                      Explain further
                  </button>
              </div>
            )}
            
            {!message.isStreaming && furtherReadingLinks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <h4 className="text-sm font-semibold mb-2 text-gray-300">Further Reading</h4>
                <div className="flex flex-col space-y-2">
                  {furtherReadingLinks.map((link, index) => (
                    <ResourceLink key={index} link={link} type="website" />
                  ))}
                </div>
              </div>
            )}

            {!message.isStreaming && videoLinks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <h4 className="text-sm font-semibold mb-2 text-gray-300">Explanatory Videos</h4>
                <div className="flex flex-col space-y-2">
                  {videoLinks.map((link, index) => (
                    <ResourceLink key={index} link={link} type="youtube" />
                  ))}
                </div>
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
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
    </div>
  );
};

export default Message;