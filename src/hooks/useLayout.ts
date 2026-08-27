import { useState, useEffect } from 'react';

export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type LayoutListener = (pageId: string, count: ColumnCount) => void;
const LISTENERS = new Set<LayoutListener>();

export function getPageColumnCount(pageId?: string | null): ColumnCount {
  if (!pageId) return 3;
  const saved = localStorage.getItem(`portal-columns-${pageId}`);
  if (saved) {
    const val = parseInt(saved, 10);
    if (val >= 1 && val <= 8) return val as ColumnCount;
  }
  // Fallback to legacy global value if present, else 3
  const legacy = localStorage.getItem('portal-columns');
  if (legacy) {
    const val = parseInt(legacy, 10);
    if (val >= 1 && val <= 8) return val as ColumnCount;
  }
  return 3;
}

export function useLayout(pageId?: string | null) {
  const [columnCount, setColumnCountState] = useState<ColumnCount>(() => getPageColumnCount(pageId));

  // Sync state whenever pageId changes
  useEffect(() => {
    setColumnCountState(getPageColumnCount(pageId));
  }, [pageId]);

  useEffect(() => {
    const listener: LayoutListener = (changedPageId, count) => {
      if (changedPageId === pageId || !pageId) {
        setColumnCountState(count);
      }
    };
    LISTENERS.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (pageId && e.key === `portal-columns-${pageId}` && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (val >= 1 && val <= 8) {
          setColumnCountState(val as ColumnCount);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      LISTENERS.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pageId]);

  const setColumnCount = (count: ColumnCount) => {
    if (pageId) {
      localStorage.setItem(`portal-columns-${pageId}`, count.toString());
      setColumnCountState(count);
      LISTENERS.forEach((listener) => listener(pageId, count));
    }
  };

  return { columnCount, setColumnCount };
}
