
// Export Git models
export * from './git.models';

/**
 * Interface para configuração do editor
 */
export interface EditorConfig {
  theme: 'light' | 'dark' | 'high-contrast';
  language: string;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

/**
 * Interface para configuração da aplicação
 */
export interface AppConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  features: {
    darkMode: boolean;
    autoSave: boolean;
    gitIntegration: boolean;
  };
}

/**
 * Enum para tipos de notificação
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Interface para notificações
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}
