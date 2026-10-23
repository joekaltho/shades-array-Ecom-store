import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export function useDocumentTitle(title?: string) {
  const { settings } = useStore();
  useEffect(() => {
    document.title = title ? `${title} — ${settings.brandName}` : `${settings.brandName} — ${settings.tagline}`;
  }, [title, settings.brandName, settings.tagline]);
}

export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onEscape]);
}

export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
