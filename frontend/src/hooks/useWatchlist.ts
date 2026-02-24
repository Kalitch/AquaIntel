import { useState, useEffect, useCallback } from 'react';

export interface WatchedStation {
  id: string;
  name: string;
  addedAt: string;
}

const STORAGE_KEY = 'aquaintel:watchlist';

export function useWatchlist() {
  const [watched, setWatched] = useState<WatchedStation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WatchedStation[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watched));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [watched]);

  const addStation = useCallback((id: string, name: string) => {
    setWatched((prev) => {
      if (prev.some((s) => s.id === id)) return prev;
      return [...prev, { id, name, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeStation = useCallback((id: string) => {
    setWatched((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const isWatched = useCallback(
    (id: string) => watched.some((s) => s.id === id),
    [watched],
  );

  return { watched, addStation, removeStation, isWatched };
}
