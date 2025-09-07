
import React, { useState, useCallback } from 'react';
import { ChatMessage, Source } from './types';
import DriveInput from './components/DriveInput';
import ChatInterface from './components/ChatInterface';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { generateGroundedAnswer } from './services/geminiService';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleConnect = () => {
    setIsLoading(true);
    // Simulate processing/indexing files
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      setMessages([
        {
          id: Date.now(),
          role: 'ai',
          content: 'Knowledge base connected. How can I help you today?',
          sources: [],
        },
      ]);
    }, 2000);
  };

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: prompt,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const aiMessageId = Date.now() + 1;
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      sources: [],
    };
    setMessages(prev => [...prev, initialAiMessage]);
    
    try {
      const stream = generateGroundedAnswer(prompt);
      let finalSources: Source[] = [];

      for await (const chunk of stream) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: msg.content + chunk.text } : msg
          )
        );

        const newSources = chunk.sources;
        if (newSources && newSources.length > 0) {
            finalSources = [...new Map([...finalSources, ...newSources].map(item => [item.uri, item])).values()];
        }
      }
      
      setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, sources: finalSources } : msg
          )
        );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Gemini API Error:", errorMessage);
      setError(`Sorry, I couldn't get a response. Please check your API key and try again. Error: ${errorMessage}`);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, content: 'Error fetching response.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="flex items-center justify-center p-4 border-b border-gray-700 shadow-md">
        <SparklesIcon className="w-8 h-8 text-accent-blue mr-3" />
        <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
          IntelliDrive RAG
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col bg-gray-800 rounded-xl shadow-2xl border border-gray-700 animate-fade-in">
          {!isConnected ? (
            <DriveInput onConnect={handleConnect} isLoading={isLoading} />
          ) : (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
