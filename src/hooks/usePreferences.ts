import { useState, useEffect } from 'react';

export type FontSize = 'compact' | 'normal' | 'large';

export interface ProfileSchedule {
  enabled: boolean;
  proDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  proStartTime: string; // "08:30"
  proEndTime: string; // "18:00"
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

let globalFontSizeSection: FontSize = getStoredFontSizeSection();
let globalFontSizeRss: FontSize = getStoredFontSizeRss();
let globalSchedule: ProfileSchedule = getStoredSchedule();

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
  const [fontSizeRss, setFontSizeRssState] = useState<FontSize>(globalFontSizeRss);
  const [schedule, setScheduleState] = useState<ProfileSchedule>(globalSchedule);

  useEffect(() => {
    const listener = () => {
      setFontSizeSectionState(globalFontSizeSection);
      setFontSizeRssState(globalFontSizeRss);
      setScheduleState(globalSchedule);
    };
    LISTENERS.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'portal-font-size-section' || e.key === 'portal-font-size-rss' || e.key === 'portal-profile-schedule') {
        globalFontSizeSection = getStoredFontSizeSection();
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
  };

  const setFontSizeRss = (size: FontSize) => {
    globalFontSizeRss = size;
    localStorage.setItem('portal-font-size-rss', size);
    setFontSizeRssState(size);
    LISTENERS.forEach((l) => l());
  };

  const setSchedule = (newSchedule: ProfileSchedule) => {
    globalSchedule = newSchedule;
    localStorage.setItem('portal-profile-schedule', JSON.stringify(newSchedule));
    setScheduleState(newSchedule);
    LISTENERS.forEach((l) => l());
  };

  return {
    fontSizeSection,
    setFontSizeSection,
    fontSizeRss,
    setFontSizeRss,
    schedule,
    setSchedule,
    getCurrentScheduledProfile: () => calculateScheduledProfile(schedule),
  };
}
