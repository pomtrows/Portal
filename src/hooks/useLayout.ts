import { useState, useEffect } from 'react';

export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function useLayout() {
  const [columnCount, setColumnCountState] = useState<ColumnCount>(() => {
    // Check localStorage or default to 3
    const saved = localStorage.getItem('portal-columns');
    return saved ? (parseInt(saved, 10) as ColumnCount) : 3;
  });

  useEffect(() => {
    localStorage.setItem('portal-columns', columnCount.toString());
  }, [columnCount]);

  const setColumnCount = (count: ColumnCount) => {
    setColumnCountState(count);
  };

  return { columnCount, setColumnCount };
}
