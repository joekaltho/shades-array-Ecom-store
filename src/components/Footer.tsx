import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { displayPhone } from '../lib/format';
import { buildGeneralMessage, whatsappLink } from '../lib/whatsapp';
import { Logo } from './Logo';

export function Footer() {
  const { settings, categories } = useStore();
  const handle = settings.instagram.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="container-wide grid gap-10 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo variant="full" alt={settings.brandName} className="h-24 w-auto" />
          {settings.footerBlurb && <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">{settings.footerBlurb}</p>}
        </div>

        <div className="md:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/shop" className="hover:text-gold">All sunglasses</Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/shop?category=${c.slug}`} className="hover:text-gold">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={whatsappLink(settings.whatsapp, buildGeneralMessage(settings.brandName))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
                {displayPhone(settings.whatsapp)}
              </a>
            </li>
            {handle && (
              <li>
                <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gold">
                  <Instagram className="h-4 w-4" aria-hidden />@{handle}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 hover:text-gold">
                  <Mail className="h-4 w-4" aria-hidden />
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="inline-flex items-start gap-2 text-neutral-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {settings.address}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-100 px-5 py-5 text-center text-xs text-neutral-500 sm:px-8">
        © {new Date().getFullYear()} {settings.brandName}. All rights reserved.
      </div>
    </footer>
  );
}
