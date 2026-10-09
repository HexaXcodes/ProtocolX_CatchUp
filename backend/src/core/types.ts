export type Role = 'student' | 'developer' | 'lead' | 'custom';
export interface Profile {
  name: string;
  role: Role;
  interests: string[];
  responsibilities: string;
  length: 'brief' | 'detailed';
}
export interface Message {
  id: string;
  author: string;
  text: string;
  /** Local wall-clock time from export, not an inferred sender timezone. */
  timestamp: string | null;
}
export interface ParsedChat {
  messages: Message[];
  participants: string[];
  warnings: string[];
  ignoredLines: number;
}
export type DateOrder = 'DMY' | 'MDY';
export type Category = 'actions' | 'decisions' | 'updates';
export interface BriefItem {
  category: Category;
  text: string;
  sourceIds: string[];
  priority: 'high' | 'normal';
  reason: string;
  /** Only an exact source excerpt, never a generated/normalized date. */
  deadlineQuote: string | null;
}
export interface Brief {
  mode: 'ai' | 'extractive';
  items: BriefItem[];
  warnings: string[];
  stats: { totalMessages: number; selectedMessages: number; analyzedMessages: number; elapsedMs: number };
}
