import React, { createContext, useContext } from 'react';

interface ChatContextType {
  onKeywordVideoSearch: (keyword: string) => void;
}

// Default context value with a warning to ensure it's used within a provider
const ChatContext = createContext<ChatContextType>({
  onKeywordVideoSearch: () => console.warn('onKeywordVideoSearch function was called without a ChatProvider.'),
});

/**
 * Custom hook to consume the ChatContext.
 */
export const useChat = () => useContext(ChatContext);

/**
 * The Provider component for the ChatContext.
 */
export const ChatProvider = ChatContext.Provider;
