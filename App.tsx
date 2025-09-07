
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Source, YouTubeVideo } from './types';
import ChatInterface from './components/ChatInterface';
import IndexingProgress from './components/IndexingProgress';
import KeywordsSidebar from './components/KeywordsSidebar';
import VisualExplainer from './components/VisualExplainer';
import VideoPlayerModal from './components/VideoPlayerModal';
import AnimationGenerationModal from './components/AnimationGenerationModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ListIcon } from './components/icons/ListIcon';
import { generateGroundedAnswer, extractKeywords, generateVisualExplanation, transformQuery, findYoutubeVideo, generateAnimationExplanation } from './services/geminiService';

const App: React.FC = () => {
  // Check localStorage to see if indexing has been completed before.
  const checkIsIndexed = useCallback(() => {
    try {
      return window.localStorage.getItem('intellidrive_indexed') === 'true';
    } catch (e) {
      console.warn("Could not access localStorage. Defaulting to false.");
      return false;
    }
  }, []);

  const [appStatus, setAppStatus] = useState<'indexing' | 'ready'>(
    checkIsIndexed() ? 'ready' : 'indexing'
  );

  // Set initial message based on whether we are loading or not.
  const getInitialMessages = useCallback((): ChatMessage[] => {
    if (checkIsIndexed()) {
      return [{
        id: Date.now(),
        role: 'ai',
        content: "Knowledge base indexed and ready. Welcome back! How can I help you today?",
        sources: [],
      }];
    }
    return []; // No messages while indexing
  }, [checkIsIndexed]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);

  // State for the visual explainer feature
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState<boolean>(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<boolean>(false);
  const [visualImageUrl, setVisualImageUrl] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // State for the new video player feature
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // State for the new animation feature
  const [selectedAnimationKeyword, setSelectedAnimationKeyword] = useState<string | null>(null);
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState<boolean>(false);
  const [animationStatusMessage, setAnimationStatusMessage] = useState<string>('');
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);

  useEffect(() => {
    // This effect handles the one-time indexing process if needed.
    if (appStatus === 'indexing') {
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
        try {
          // Mark indexing as complete for future sessions.
          window.localStorage.setItem('intellidrive_indexed', 'true');
        } catch (e) {
          console.warn("Could not write to localStorage.");
        }
      }, 6000); // The duration of the simulated indexing.

      return () => clearTimeout(indexingTimer);
    }
  }, [appStatus]);

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

  const handleGenerateVisual = useCallback(async (keyword: string) => {
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

  const handleGenerateAnimation = useCallback(async (keyword: string) => {
    setSelectedAnimationKeyword(keyword);
    setIsGeneratingAnimation(true);
    setAnimationUrl(null);
    setAnimationError(null);
    
    try {
      const animationGenerator = generateAnimationExplanation(keyword);
      for await (const result of animationGenerator) {
        setAnimationStatusMessage(result.message || '');
        if (result.status === 'DONE' && result.url) {
          setAnimationUrl(result.url);
          setIsGeneratingAnimation(false);
        } else if (result.status === 'ERROR') {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Animation Generation Error:", errorMessage);
      setAnimationError(`Sorry, I couldn't generate an animation for "${keyword}". ${errorMessage}`);
      setIsGeneratingAnimation(false);
    }
  }, []);
  
  const handlePlayVideoForKeyword = useCallback(async (keyword: string) => {
    setIsVideoLoading(true);
    setVideoError(null);
    setPlayingVideo({ title: `Searching for: ${keyword}`, videoId: '' }); // Show modal immediately with loading state
    try {
      const videoData = await findYoutubeVideo(keyword);
      if (videoData) {
        setPlayingVideo(videoData);
      } else {
        throw new Error("No relevant video was found.");
      }
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       console.error("Video Search Error:", errorMessage);
       setVideoError(`Sorry, I couldn't find a video for "${keyword}".`);
       // Keep modal open to show error, but clear video data
       setPlayingVideo(null);
    } finally {
      setIsVideoLoading(false);
    }
  }, []);

  const handleCloseVisualizer = () => {
    setSelectedKeyword(null);
  };
  
  const handleCloseVideoPlayer = () => {
    setPlayingVideo(null);
    setVideoError(null);
  };

  const handleCloseAnimationModal = () => {
    if (animationUrl) {
      URL.revokeObjectURL(animationUrl); // Clean up blob URL
    }
    setSelectedAnimationKeyword(null);
    setIsGeneratingAnimation(false);
    setAnimationUrl(null);
    setAnimationError(null);
    setAnimationStatusMessage('');
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
              onKeywordVideoSearch={handlePlayVideoForKeyword}
            />
          )}
        </div>
        {appStatus === 'ready' && (
          <KeywordsSidebar
            keywords={keywords}
            onKeywordVisualize={handleGenerateVisual}
            onKeywordAnimate={handleGenerateAnimation}
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

      {(playingVideo || isVideoLoading || videoError) && (
          <VideoPlayerModal
            video={playingVideo}
            isLoading={isVideoLoading}
            error={videoError}
            onClose={handleCloseVideoPlayer}
          />
      )}
      
      {selectedAnimationKeyword && (
        <AnimationGenerationModal
          keyword={selectedAnimationKeyword}
          videoUrl={animationUrl}
          isLoading={isGeneratingAnimation}
          statusMessage={animationStatusMessage}
          error={animationError}
          onClose={handleCloseAnimationModal}
        />
      )}
    </div>
  );
};

export default App;
