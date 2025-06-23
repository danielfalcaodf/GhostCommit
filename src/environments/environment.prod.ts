import { AppConfig } from '../app/shared/models';

export const environment: AppConfig = {
  version: '1.0.0',
  environment: 'production',
  features: {
    darkMode: true,
    autoSave: true,
    gitIntegration: true
  }
};

export const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 1
};

export const EDITOR_CONFIG = {
  defaultTheme: 'vs-dark',
  defaultLanguage: 'typescript',
  autoSaveInterval: 5000
};
