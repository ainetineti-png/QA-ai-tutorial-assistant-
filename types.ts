export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  sources?: Source[];
}

export interface ResourceLinkInfo {
  title: string;
  url: string;
}

export interface YouTubeVideo {
  title: string;
  videoId: string;
}
