import type { Backend } from './backend';
import { isSupabaseConfigured } from './supabase';
import { supabaseBackend } from './supabaseBackend';
import { createLocalBackend } from './localBackend';

/**
 * Production talks to Supabase. With no env vars, `npm run dev` falls back to an
 * in-browser stand-in so you can click around. That stand-in is dead code in a
 * production build, so a deploy without env vars shows a setup notice instead.
 */
export const api: Backend | null = isSupabaseConfigured
  ? supabaseBackend
  : import.meta.env.DEV
    ? createLocalBackend()
    : null;

export function requireApi(): Backend {
  if (!api) throw new Error('The store backend is not configured.');
  return api;
}
