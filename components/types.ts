export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
}

export interface ResourceLinkInfo {
  title: string;
  url: string;
}

export interface YouTubeVideo {
  title: string;
  videoId: string;
}

// Represents the AI's analysis of the user's current state
export interface UserProfile {
  sentiment: 'curious' | 'confused' | 'confident' | 'neutral';
  knowledgeLevel: 'beginner' | 'intermediate' | 'expert';
  learningStyle: 'visual' | 'detailed' | 'concise';
}