export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export interface Settings {
  theme: string;
  model: string;
  temperature: string;
  max_tokens: string;
  system_prompt: string;
  voice_enabled?: string;
  tts_enabled?: string;
  language?: string;
  font_size?: string;
  code_auto_run?: string;
  backend_url?: string;
}
