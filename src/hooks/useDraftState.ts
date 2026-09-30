import { useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/** Local, per-account draft. Writes synchronously so navigation cannot lose the last keystroke. */
export function useDraftState<T>(name: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>, () => void, boolean] {
  const { user, viewingAsUserId } = useAuth();
  const key = user ? `draft:v1:${user.id}:${viewingAsUserId || user.id}:${name}` : '';
  const fallback = () => typeof initial === 'function' ? (initial as () => T)() : initial;
  const read = (): { value: T; exists: boolean } => {
    if (!key) return { value: fallback(), exists: false };
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return { value: JSON.parse(raw) as T, exists: true };
    } catch { /* Storage can be unavailable or contain an obsolete draft. */ }
    return { value: fallback(), exists: false };
  };
  const [entry, setEntry] = useState(() => ({ key, ...read() }));
  const current = entry.key === key ? entry : { key, ...read() };
  const set: Dispatch<SetStateAction<T>> = next => {
    const value = typeof next === 'function' ? (next as (previous: T) => T)(current.value) : next;
    if (key) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Still editable in memory. */ }
    }
    setEntry({ key, value, exists: true });
  };
  const clear = () => {
    if (key) { try { localStorage.removeItem(key); } catch {} }
    setEntry({ key, value: fallback(), exists: false });
  };
  return [current.value, set, clear, current.exists];
}
