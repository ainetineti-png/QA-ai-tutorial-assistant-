import React, { useState, useCallback, useEffect } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage, Source, YouTubeVideo, UserProfile } from './types';
import ChatInterface from './components/ChatInterface';
import KeywordsSidebar from './components/KeywordsSidebar';
import VisualExplainer from './components/VisualExplainer';
import VideoPlayerModal from './components/VideoPlayerModal';
import ConfirmationModal from './components/ConfirmationModal';
import AnimationGenerationModal from './components/AnimationGenerationModal';
import { ListIcon } from './components/icons/ListIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { startChat, extractKeywords, generateVisualExplanation, editVisualExplanation, transformQuery, findYoutubeVideo, generateAnimationExplanation, analyzeChatHistory } from './services/geminiService';
import { ChatProvider } from './contexts/ChatContext';

// --- Local Storage Utilities ---
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
};
// --- End Local Storage Utilities ---

type AppStatus = 'ready';

const App: React.FC = () => {
  // Hardcode the app state to 'ready' and knowledge base URL. The setup screens are bypassed.
  const [appStatus, setAppStatus] = useState<AppStatus>('ready');
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('https://drive.google.com/drive/folders/146zHLEQjr0GL_Hn1ovOA-o1H0O6vxXmX');

  const getInitialWelcomeMessage = useCallback((): ChatMessage => ({
      id: Date.now(),
      role: 'ai',
      content: "Knowledge base loaded and ready. Welcome! How can I help you today?",
      sources: [],
  }), []);
  
  const getInitialMessages = useCallback((): ChatMessage[] => {
    try {
        const storedMessages = window.localStorage.getItem('intellidrive_messages');
        if (storedMessages && JSON.parse(storedMessages).length > 0) {
            return JSON.parse(storedMessages);
        }
         return [getInitialWelcomeMessage()];
    } catch (e) {
      console.warn("Could not parse messages from localStorage.", e);
      return [getInitialWelcomeMessage()];
    }
  }, [getInitialWelcomeMessage]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('intellidrive_messages', getInitialMessages());
  const [userProfile, setUserProfile] = usePersistentState<UserProfile | null>('intellidrive_user_profile', null);
  const [chat, setChat] = useState<Chat | null>(null);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState<boolean>(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<boolean>(false);
  const [visualImageUrl, setVisualImageUrl] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isClearConfirmationVisible, setIsClearConfirmationVisible] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedAnimationKeyword, setSelectedAnimationKeyword] = useState<string | null>(null);
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState<boolean>(false);
  const [animationStatusMessage, setAnimationStatusMessage] = useState<string>('');
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (appStatus === 'ready') {
      setChat(startChat(userProfile));
    }
  }, [appStatus, userProfile]);

  const handleResetApp = () => {
    // We only clear the chat history and related state, not the knowledge base itself.
    setMessages([getInitialWelcomeMessage()]);
    setUserProfile(null);
    setKeywords([]);
    setError(null);
    setIsClearConfirmationVisible(false);
  };

  const handleSendMessage = useCallback(async (prompt: string, options?: { skipTransform?: boolean }) => {
    if (!prompt || !chat) return;

    setIsSidebarVisible(false);
    setKeywords([]);
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: prompt,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    analyzeChatHistory(newMessages).then(setUserProfile).catch(err => {
        console.warn("Could not analyze user profile:", err);
    });

    const aiMessageId = Date.now() + 1;
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      sources: [],
      isStreaming: true,
    };
    setMessages(prev => [...prev, initialAiMessage]);
    
    let finalAnswer = '';
    let finalSources: Source[] = [];
    try {
      const transformedPrompt = options?.skipTransform ? prompt : await transformQuery(prompt);
      const stream = await chat.sendMessageStream({ message: transformedPrompt });
      
      for await (const chunk of stream) {
        finalAnswer += chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: finalAnswer } : msg
          )
        );

        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        const newSources = (groundingMetadata?.groundingChunks ?? [])
            .map(ch => ch.web)
            .filter((web): web is { uri: string; title?: string } => !!web && !!web.uri)
            .map(web => ({ uri: web.uri, title: web.title || web.uri }));

        if (newSources && newSources.length > 0) {
            finalSources = [...new Map([...finalSources, ...newSources].map(item => [item.uri, item])).values()];
        }
      }

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
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, sources: finalSources, isStreaming: false } : msg
        )
      );
      if (finalAnswer.trim().length > 50) { 
        setIsKeywordsLoading(true);
        try {
          const extracted = await extractKeywords(finalAnswer);
          setKeywords(extracted);
        } catch (keywordError) {
           console.warn("Could not extract keywords:", keywordError);
        } finally {
          setIsKeywordsLoading(false);
        }
      }
    }
  }, [messages, setMessages, userProfile, setUserProfile, chat]);

  const handleExplainFurther = useCallback(() => {
    handleSendMessage("Can you explain the previous response in more detail, focusing on its key points?", { skipTransform: true });
  }, [handleSendMessage]);

  const handleVisualizeKeyword = useCallback(async (keyword: string) => {
    setSelectedKeyword(keyword);
    setIsGeneratingVisual(true);
    setVisualError(null);
    setVisualImageUrl(null);
    try {
      const imageUrl = await generateVisualExplanation(keyword);
      setVisualImageUrl(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setVisualError(errorMessage);
    } finally {
      setIsGeneratingVisual(false);
    }
  }, []);

  const handleEditVisual = useCallback(async (base64Image: string, prompt: string): Promise<void> => {
      setIsGeneratingVisual(true);
      setVisualError(null);
      try {
          const newImageUrl = await editVisualExplanation(base64Image, prompt);
          setVisualImageUrl(newImageUrl);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setVisualError(`Failed to edit image: ${errorMessage}`);
      } finally {
          setIsGeneratingVisual(false);
      }
  }, []);

  const handleAnimateKeyword = useCallback(async (keyword: string) => {
    setSelectedAnimationKeyword(keyword);
    setIsGeneratingAnimation(true);
    setAnimationError(null);
    setAnimationUrl(null);
    setAnimationStatusMessage('');

    try {
        const stream = generateAnimationExplanation(keyword);
        for await (const result of stream) {
            setAnimationStatusMessage(result.message || '');
            if (result.status === 'DONE' && result.url) {
                setAnimationUrl(result.url);
                break; 
            }
            if (result.status === 'ERROR') {
                throw new Error(result.message);
            }
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setAnimationError(errorMessage);
    } finally {
        setIsGeneratingAnimation(false);
    }
  }, []);

  const handleVideoSearch = useCallback(async (keyword: string) => {
    setIsVideoLoading(true);
    setVideoError(null);
    setPlayingVideo({ title: `Searching for "${keyword}"...`, videoId: '' }); 
    try {
      const video = await findYoutubeVideo(keyword);
      if (video) {
        setPlayingVideo(video);
      } else {
        setVideoError(`Could not find a suitable video for "${keyword}".`);
        setPlayingVideo(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setVideoError(`Error fetching video: ${errorMessage}`);
      setPlayingVideo(null);
    } finally {
      setIsVideoLoading(false);
    }
  }, []);

  return (
    <>
      <ChatProvider value={{ onKeywordVideoSearch: handleVideoSearch }}>
        <div className="h-screen w-screen flex flex-col p-4 bg-gray-900">
          <header className="flex items-center justify-between pb-4 border-b border-white/10">
              <h1 className="text-xl font-bold text-gray-100">IntelliDrive RAG</h1>
              <div className="flex items-center gap-2">
                  <button
                      onClick={() => setIsClearConfirmationVisible(true)}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                      aria-label="Clear Chat"
                  >
                      <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                      className="md:hidden p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                      aria-label="Toggle key concepts sidebar"
                  >
                      <ListIcon className="w-5 h-5" />
                  </button>
              </div>
          </header>

          <main className="flex flex-1 overflow-hidden pt-4 gap-4">
            <div className="flex-1 flex flex-col bg-gray-800 rounded-xl border border-white/10 shadow-lg overflow-hidden">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                error={error}
                onExplainFurther={handleExplainFurther}
              />
            </div>
            <KeywordsSidebar
              keywords={keywords}
              onKeywordVisualize={handleVisualizeKeyword}
              onKeywordAnimate={handleAnimateKeyword}
              isLoading={isKeywordsLoading}
              isOpen={isSidebarVisible}
              onClose={() => setIsSidebarVisible(false)}
            />
          </main>
        </div>
      </ChatProvider>

      {selectedKeyword && (
        <VisualExplainer
          keyword={selectedKeyword}
          imageUrl={visualImageUrl}
          isLoading={isGeneratingVisual}
          error={visualError}
          onClose={() => setSelectedKeyword(null)}
          onEdit={handleEditVisual}
        />
      )}

      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          isLoading={isVideoLoading}
          error={videoError}
          onClose={() => { setPlayingVideo(null); setVideoError(null); }}
        />
      )}

      {selectedAnimationKeyword && (
        <AnimationGenerationModal
            keyword={selectedAnimationKeyword}
            videoUrl={animationUrl}
            isLoading={isGeneratingAnimation}
            statusMessage={animationStatusMessage}
            error={animationError}
            onClose={() => setSelectedAnimationKeyword(null)}
        />
      )}
      
      {isClearConfirmationVisible && (
        <ConfirmationModal
          title="Clear Chat History"
          message="Are you sure you want to clear the entire conversation? This action cannot be undone."
          confirmText="Clear Chat"
          onConfirm={handleResetApp}
          onCancel={() => setIsClearConfirmationVisible(false)}
        />
      )}
    </>
  );
};

export default App;
