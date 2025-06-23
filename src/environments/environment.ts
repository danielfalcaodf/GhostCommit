import { AppConfig } from '../app/shared/models';

export const environment: AppConfig = {
  version: '1.0.0',
  environment: 'development',
  features: {
    darkMode: true,
    autoSave: true,
    gitIntegration: true
  }
};

export const API_CONFIG = {
  timeout: 5000,
  retryAttempts: 3
};

export const EDITOR_CONFIG = {
  defaultTheme: 'vs-dark',
  defaultLanguage: 'typescript',
  autoSaveInterval: 2000
};
