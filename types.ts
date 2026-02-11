
export type ProviderType = 'google' | 'openai' | 'anthropic' | 'openrouter' | 'local';

export type AppTheme = 'dark' | 'light' | 'midnight' | 'solarized';

export type LogLevel = 'info' | 'error' | 'warning' | 'success';

export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  contextWindow: number;
  vision: boolean;
}

export interface SettingsState {
  activeProvider: ProviderType;
  activeModelId: string;
  apiKeys: Record<ProviderType, string>;
  customModels: ModelConfig[];
  customEndpoints: Record<ProviderType, string>;
  editorFontSize: number;
  editorWordWrap: 'on' | 'off';
  theme: AppTheme;
}

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string | null;
  language?: string;
  parentId?: string | null;
  isOpen?: boolean;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string; 
  modelName?: string; 
  timestamp: number;
  attachments?: FileAttachment[];
  pendingActions?: AgentAction[]; 
}

export interface AgentAction {
  type: 'edit' | 'create';
  data: FileEdit | FileCreate;
  applied: boolean;
}

export interface FileCreate {
  path: string;
  content: string;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface FileEdit {
  filePath: string;
  search: string;
  replace: string;
  applied: boolean;
}

export interface AppState {
  files: Record<string, FileSystemItem>;
  activeFileId: string | null;
  openFileIds: string[];
  chatHistory: ChatMessage[];
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  isSettingsOpen: boolean;
  settings: SettingsState;
}
