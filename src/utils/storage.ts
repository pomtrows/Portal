import type { DashboardConfig } from '../types';
import { defaultConfig } from '../data/defaultConfig';

const STORAGE_KEY = 'portal_dashboard_config';

export const loadConfig = (): DashboardConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load config from localStorage", e);
  }
  return defaultConfig;
};

export const saveConfig = (config: DashboardConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config to localStorage", e);
  }
};
