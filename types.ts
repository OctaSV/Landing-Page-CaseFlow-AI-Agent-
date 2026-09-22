

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface QuickReply {
  title: string;
  payload: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  image?: string;
  isGrounded?: boolean;
  groundingSources?: GroundingSource[];
  quickReplies?: QuickReply[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface DocumentChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'uploaded';
}

export interface ChatSession {
  id: string;
  messages: Message[];
  checklist?: DocumentChecklistItem[];
  isChecklistVisible?: boolean;
  progress?: number;
  analyzedVariables?: string[];
  indemnificationProgress?: number;
}