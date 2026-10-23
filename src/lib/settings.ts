import type { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  brandName: 'Shades Array',
  tagline: 'See the world in style',
  whatsapp: '2348032498333',
  instagram: '',
  email: '',
  address: '',
  deliveryNote: '',
  announcement: { enabled: false, text: '' },
  hero: {
    headline: 'See the world in style.',
    subheadline: 'Browse the collection, add your picks to your bag and finish your order on WhatsApp.',
    imageUrl: '/images/hero.jpg',
  },
  about: { title: 'About us', body: '' },
  footerBlurb: '',
};

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Merges whatever is stored in the database over the defaults, ignoring bad types. */
export function mergeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const r = obj(raw);
  const ann = obj(r.announcement);
  const hero = obj(r.hero);
  const about = obj(r.about);
  return {
    brandName: str(r.brandName, d.brandName).trim() || d.brandName,
    tagline: str(r.tagline, d.tagline),
    whatsapp: str(r.whatsapp, d.whatsapp).replace(/\D/g, '') || d.whatsapp,
    instagram: str(r.instagram, d.instagram),
    email: str(r.email, d.email),
    address: str(r.address, d.address),
    deliveryNote: str(r.deliveryNote, d.deliveryNote),
    announcement: {
      enabled: typeof ann.enabled === 'boolean' ? ann.enabled : d.announcement.enabled,
      text: str(ann.text, d.announcement.text),
    },
    hero: {
      headline: str(hero.headline, d.hero.headline),
      subheadline: str(hero.subheadline, d.hero.subheadline),
      imageUrl: str(hero.imageUrl, d.hero.imageUrl) || d.hero.imageUrl,
    },
    about: { title: str(about.title, d.about.title), body: str(about.body, d.about.body) },
    footerBlurb: str(r.footerBlurb, d.footerBlurb),
  };
}
