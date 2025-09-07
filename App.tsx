
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Source } from './types';
import ChatInterface from './components/ChatInterface';
import IndexingProgress from './components/IndexingProgress';
import KeywordsSidebar from './components/KeywordsSidebar';
import VisualExplainer from './components/VisualExplainer';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ListIcon } from './components/icons/ListIcon';
import { generateGroundedAnswer, extractKeywords, generateVisualExplanation, transformQuery } from './services/geminiService';

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'indexing' | 'ready'>('indexing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // State for the new visual explainer feature
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState<boolean>(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<boolean>(false);
  const [visualImageUrl, setVisualImageUrl] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const indexingTimer = setTimeout(() => {
      setAppStatus('ready');
      setMessages([
        {
          id: Date.now(),
          role: 'ai',
          content: "Knowledge base indexed and ready. I have access to all documents in the specified Drive folder. How can I help you today?",
          sources: [],
        },
      ]);
    }, 6000);

    return () => clearTimeout(indexingTimer);
  }, []);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt) return;

    setIsSidebarVisible(false);
    setKeywords([]);
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
    
    let finalAnswer = '';
    try {
      // RAG Improvement: Transform the user's query for better retrieval.
      const transformedPrompt = await transformQuery(prompt);

      const stream = generateGroundedAnswer(transformedPrompt);
      let finalSources: Source[] = [];
      
      for await (const chunk of stream) {
        finalAnswer += chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: finalAnswer } : msg
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
      setError(`Sorry, I couldn't get a response. Error: ${errorMessage}`);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, content: 'Error fetching response.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
      if (finalAnswer.trim().length > 50) { // Only extract keywords for substantial answers
        setIsKeywordsLoading(true);
        try {
          const extracted = await extractKeywords(finalAnswer);
          setKeywords(extracted);
        } catch (keywordError) {
          console.error("Failed to extract keywords:", keywordError);
        } finally {
          setIsKeywordsLoading(false);
        }
      }
    }
  }, []);

  const handleKeywordClick = useCallback(async (keyword: string) => {
    setSelectedKeyword(keyword);
    setIsGeneratingVisual(true);
    setVisualImageUrl(null);
    setVisualError(null);
    try {
      const imageUrl = await generateVisualExplanation(keyword);
      setVisualImageUrl(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Image Generation Error:", errorMessage);
      setVisualError(`Sorry, I couldn't generate a visual for "${keyword}". Please try another concept.`);
    } finally {
      setIsGeneratingVisual(false);
    }
  }, []);

  const handleCloseVisualizer = () => {
    setSelectedKeyword(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="relative flex items-center justify-center p-4 border-b border-gray-700 shadow-md">
        <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-accent-blue mr-3" />
            <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
            IntelliDrive RAG
            </h1>
        </div>
        {appStatus === 'ready' && (
            <button
                onClick={() => setIsSidebarVisible(true)}
                className="absolute right-4 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors md:hidden"
                aria-label="Open key concepts"
            >
                <ListIcon className="w-6 h-6" />
            </button>
        )}
      </header>

      <main className="flex-grow flex flex-row items-start p-4 overflow-hidden gap-4">
        <div className="w-full h-full flex flex-col bg-gray-800 rounded-xl shadow-2xl border border-gray-700 animate-fade-in">
          {appStatus === 'indexing' ? (
            <IndexingProgress />
          ) : (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
        {appStatus === 'ready' && (
          <KeywordsSidebar
            keywords={keywords}
            onKeywordClick={handleKeywordClick}
            isLoading={isKeywordsLoading}
            isOpen={isSidebarVisible}
            onClose={() => setIsSidebarVisible(false)}
          />
        )}
      </main>
      
      {selectedKeyword && (
        <VisualExplainer 
          keyword={selectedKeyword}
          imageUrl={visualImageUrl}
          isLoading={isGeneratingVisual}
          error={visualError}
          onClose={handleCloseVisualizer}
        />
      )}
    </div>
  );
};

export default App;
