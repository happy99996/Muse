export enum AppMode {
  STORYTELLER = 'STORYTELLER',
  CHAT = 'CHAT',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  isLoading?: boolean;
}

export interface StoryState {
  image: string | null; // Base64
  generatedStory: string | null;
  isGeneratingStory: boolean;
  isGeneratingAudio: boolean;
  audioBlobUrl: string | null;
  error: string | null;
}
