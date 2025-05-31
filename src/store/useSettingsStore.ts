import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types/app.types';

interface SettingsStore {
  settings: AppSettings;
  updateJiraSettings: (jira: AppSettings['jira']) => void;
  updateNotionSettings: (notion: AppSettings['notion']) => void;
  updateLLMSettings: (llm: AppSettings['llm']) => void;
}

const defaultSettings: AppSettings = {
  jira: {
    email: '',
    apiToken: '',
    domain: '',
    projects: [],
  },
  notion: {
    apiKey: '',
    databaseIds: [],
  },
  llm: {
    provider: 'openai',
    apiKey: '',
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateJiraSettings: (jira) =>
        set((state) => ({ settings: { ...state.settings, jira } })),
      updateNotionSettings: (notion) =>
        set((state) => ({ settings: { ...state.settings, notion } })),
      updateLLMSettings: (llm) =>
        set((state) => ({ settings: { ...state.settings, llm } })),
    }),
    {
      name: 'team-lead-settings',
    }
  )
); 