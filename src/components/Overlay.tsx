import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEscape, useLockBodyScroll } from '../lib/hooks';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Slide in from the right (drawer) or sit centred (modal). */
  variant?: 'drawer' | 'modal';
  widthClass?: string;
  children: ReactNode;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Accessible dialog shell: Escape closes, focus is trapped and restored, body scroll is locked. */
export function Overlay({ open, onClose, title, variant = 'drawer', widthClass = 'max-w-md', children }: OverlayProps) {
  const panel = useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !el) return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const isDrawer = variant === 'drawer';
  return (
    <div className={`fixed inset-0 z-[60] flex ${isDrawer ? 'justify-end' : 'items-center justify-center p-4'}`}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex w-full flex-col bg-white shadow-2xl ${widthClass} ${
          isDrawer ? 'h-full animate-slide-in' : 'max-h-[90vh] animate-fade-in'
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 p-2 text-neutral-500 hover:bg-neutral-100 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
