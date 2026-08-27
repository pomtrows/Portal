import { useState, useEffect } from 'react';

export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const LISTENERS = new Set<(count: ColumnCount) => void>();

function getInitialColumnCount(): ColumnCount {
  const saved = localStorage.getItem('portal-columns');
  if (saved) {
    const val = parseInt(saved, 10);
    if (val >= 1 && val <= 8) return val as ColumnCount;
  }
  return 3;
}

let globalColumnCount: ColumnCount = getInitialColumnCount();

export function useLayout() {
  const [columnCount, setColumnCountState] = useState<ColumnCount>(globalColumnCount);

  useEffect(() => {
    const listener = (count: ColumnCount) => {
      setColumnCountState(count);
    };
    LISTENERS.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'portal-columns' && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (val >= 1 && val <= 8) {
          globalColumnCount = val as ColumnCount;
          LISTENERS.forEach(l => l(val as ColumnCount));
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      LISTENERS.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setColumnCount = (count: ColumnCount) => {
    globalColumnCount = count;
    localStorage.setItem('portal-columns', count.toString());
    LISTENERS.forEach((listener) => listener(count));
  };

  return { columnCount, setColumnCount };
}
