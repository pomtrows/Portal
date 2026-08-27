import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export type FontSize = 'compact' | 'normal' | 'large';

export interface ProfileSchedule {
  enabled: boolean;
  proDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  proStartTime: string; // "08:30"
  proEndTime: string; // "18:00"
}

export interface UserPreferences {
  theme?: string;
  fontSizeSection?: FontSize;
  fontSizeLinks?: FontSize;
  fontSizeRss?: FontSize;
  schedule?: ProfileSchedule;
  pageColumns?: Record<string, number>;
}

export const DEFAULT_SCHEDULE: ProfileSchedule = {
  enabled: false,
  proDays: [1, 2, 3, 4, 5], // Monday to Friday
  proStartTime: '08:30',
  proEndTime: '18:00',
};

const LISTENERS = new Set<() => void>();

function getStoredFontSizeSection(): FontSize {
  const saved = localStorage.getItem('portal-font-size-section');
  if (saved === 'compact' || saved === 'normal' || saved === 'large') return saved;
  return 'normal';
}

function getStoredFontSizeLinks(): FontSize {
  const saved = localStorage.getItem('portal-font-size-links');
  if (saved === 'compact' || saved === 'normal' || saved === 'large') return saved;
  return 'normal';
}

function getStoredFontSizeRss(): FontSize {
  const saved = localStorage.getItem('portal-font-size-rss');
  if (saved === 'compact' || saved === 'normal' || saved === 'large') return saved;
  return 'normal';
}

function getStoredSchedule(): ProfileSchedule {
  try {
    const saved = localStorage.getItem('portal-profile-schedule');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        enabled: Boolean(parsed.enabled),
        proDays: Array.isArray(parsed.proDays) ? parsed.proDays : DEFAULT_SCHEDULE.proDays,
        proStartTime: parsed.proStartTime || DEFAULT_SCHEDULE.proStartTime,
        proEndTime: parsed.proEndTime || DEFAULT_SCHEDULE.proEndTime,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SCHEDULE;
}

export function getAllStoredPageColumns(): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('portal-columns-')) {
      const pageId = key.replace('portal-columns-', '');
      const val = parseInt(localStorage.getItem(key) || '', 10);
      if (val >= 1 && val <= 8) {
        result[pageId] = val;
      }
    }
  }
  return result;
}

let globalFontSizeSection: FontSize = getStoredFontSizeSection();
let globalFontSizeLinks: FontSize = getStoredFontSizeLinks();
let globalFontSizeRss: FontSize = getStoredFontSizeRss();
let globalSchedule: ProfileSchedule = getStoredSchedule();

// Debounce timer for saving to Supabase user_metadata
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCloudUpdates: Partial<UserPreferences> = {};

export function syncPreferenceToCloud(partial: Partial<UserPreferences>) {
  pendingCloudUpdates = { ...pendingCloudUpdates, ...partial };

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const currentMetadata = session.user.user_metadata || {};
      const currentPrefs: UserPreferences = currentMetadata.preferences || {};

      const updatedPrefs: UserPreferences = {
        ...currentPrefs,
        ...pendingCloudUpdates,
        // merge page columns if present
        pageColumns: {
          ...(currentPrefs.pageColumns || {}),
          ...(pendingCloudUpdates.pageColumns || {}),
        },
      };

      pendingCloudUpdates = {};

      await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          preferences: updatedPrefs,
        },
      });
    } catch (err) {
      console.warn('Error syncing preferences to Supabase user_metadata:', err);
    }
  }, 400);
}

/**
 * Hydrates local storage and in-memory states with preferences from Supabase user_metadata.
 */
export function hydratePreferencesFromCloud(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || typeof metadata !== 'object') return;
  const prefs = metadata.preferences as UserPreferences | undefined;
  if (!prefs) return;

  let hasChanged = false;

  if (prefs.fontSizeSection && prefs.fontSizeSection !== globalFontSizeSection) {
    globalFontSizeSection = prefs.fontSizeSection;
    localStorage.setItem('portal-font-size-section', prefs.fontSizeSection);
    hasChanged = true;
  }

  if (prefs.fontSizeLinks && prefs.fontSizeLinks !== globalFontSizeLinks) {
    globalFontSizeLinks = prefs.fontSizeLinks;
    localStorage.setItem('portal-font-size-links', prefs.fontSizeLinks);
    hasChanged = true;
  }

  if (prefs.fontSizeRss && prefs.fontSizeRss !== globalFontSizeRss) {
    globalFontSizeRss = prefs.fontSizeRss;
    localStorage.setItem('portal-font-size-rss', prefs.fontSizeRss);
    hasChanged = true;
  }

  if (prefs.schedule) {
    globalSchedule = prefs.schedule;
    localStorage.setItem('portal-profile-schedule', JSON.stringify(prefs.schedule));
    hasChanged = true;
  }

  if (prefs.theme) {
    const currentTheme = localStorage.getItem('portal-theme');
    if (currentTheme !== prefs.theme) {
      localStorage.setItem('portal-theme', prefs.theme);
      document.documentElement.setAttribute('data-theme', prefs.theme);
    }
  }

  if (prefs.pageColumns && typeof prefs.pageColumns === 'object') {
    Object.entries(prefs.pageColumns).forEach(([pageId, col]) => {
      if (col >= 1 && col <= 8) {
        localStorage.setItem(`portal-columns-${pageId}`, col.toString());
      }
    });
  }

  if (hasChanged) {
    LISTENERS.forEach((l) => l());
  }
}

export function calculateScheduledProfile(schedule: ProfileSchedule): 'pro' | 'perso' {
  if (!schedule.enabled) return 'perso';

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  if (!schedule.proDays.includes(currentDay)) {
    return 'perso';
  }

  if (currentTime >= schedule.proStartTime && currentTime < schedule.proEndTime) {
    return 'pro';
  }

  return 'perso';
}

export function usePreferences() {
  const [fontSizeSection, setFontSizeSectionState] = useState<FontSize>(globalFontSizeSection);
  const [fontSizeLinks, setFontSizeLinksState] = useState<FontSize>(globalFontSizeLinks);
  const [fontSizeRss, setFontSizeRssState] = useState<FontSize>(globalFontSizeRss);
  const [schedule, setScheduleState] = useState<ProfileSchedule>(globalSchedule);

  useEffect(() => {
    const listener = () => {
      setFontSizeSectionState(globalFontSizeSection);
      setFontSizeLinksState(globalFontSizeLinks);
      setFontSizeRssState(globalFontSizeRss);
      setScheduleState(globalSchedule);
    };
    LISTENERS.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'portal-font-size-section' ||
        e.key === 'portal-font-size-links' ||
        e.key === 'portal-font-size-rss' ||
        e.key === 'portal-profile-schedule'
      ) {
        globalFontSizeSection = getStoredFontSizeSection();
        globalFontSizeLinks = getStoredFontSizeLinks();
        globalFontSizeRss = getStoredFontSizeRss();
        globalSchedule = getStoredSchedule();
        LISTENERS.forEach((l) => l());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      LISTENERS.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setFontSizeSection = (size: FontSize) => {
    globalFontSizeSection = size;
    localStorage.setItem('portal-font-size-section', size);
    setFontSizeSectionState(size);
    LISTENERS.forEach((l) => l());
    syncPreferenceToCloud({ fontSizeSection: size });
  };

  const setFontSizeLinks = (size: FontSize) => {
    globalFontSizeLinks = size;
    localStorage.setItem('portal-font-size-links', size);
    setFontSizeLinksState(size);
    LISTENERS.forEach((l) => l());
    syncPreferenceToCloud({ fontSizeLinks: size });
  };

  const setFontSizeRss = (size: FontSize) => {
    globalFontSizeRss = size;
    localStorage.setItem('portal-font-size-rss', size);
    setFontSizeRssState(size);
    LISTENERS.forEach((l) => l());
    syncPreferenceToCloud({ fontSizeRss: size });
  };

  const setSchedule = (newSchedule: ProfileSchedule) => {
    globalSchedule = newSchedule;
    localStorage.setItem('portal-profile-schedule', JSON.stringify(newSchedule));
    setScheduleState(newSchedule);
    LISTENERS.forEach((l) => l());
    syncPreferenceToCloud({ schedule: newSchedule });
  };

  return {
    fontSizeSection,
    setFontSizeSection,
    fontSizeLinks,
    setFontSizeLinks,
    fontSizeRss,
    setFontSizeRss,
    schedule,
    setSchedule,
    getCurrentScheduledProfile: () => calculateScheduledProfile(schedule),
  };
}
