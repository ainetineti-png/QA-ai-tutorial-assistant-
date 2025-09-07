
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
