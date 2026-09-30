import { useState, useRef, type Dispatch, type SetStateAction } from 'react';
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
  const latest = useRef(entry);
  const current = entry.key === key ? entry : { key, ...read() };
  if (latest.current.key !== key) latest.current = current;
  const set: Dispatch<SetStateAction<T>> = next => {
    const value = typeof next === 'function' ? (next as (previous: T) => T)(latest.current.value) : next;
    if (key) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Still editable in memory. */ }
    }
    latest.current = { key, value, exists: true };
    setEntry(latest.current);
  };
  const clear = () => {
    if (key) { try { localStorage.removeItem(key); } catch {} }
    latest.current = { key, value: fallback(), exists: false };
    setEntry(latest.current);
  };
  return [current.value, set, clear, current.exists];
}
