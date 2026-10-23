import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { buildGeneralMessage, whatsappLink } from '../lib/whatsapp';
import { Logo } from './Logo';

export function Navbar() {
  const { settings, categories } = useStore();
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const chat = whatsappLink(settings.whatsapp, buildGeneralMessage(settings.brandName));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[0.95rem] font-semibold transition-colors ${isActive ? 'text-gold' : 'text-neutral-700 hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container-wide flex h-[4.5rem] items-center justify-between">
        <Link to="/" aria-label={`${settings.brandName} home`} onClick={() => setMenuOpen(false)} className="shrink-0">
          <Logo alt={settings.brandName} className="h-11 w-auto sm:h-12" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <NavLink to="/shop" end className={linkClass}>
            Shop
          </NavLink>
          {categories.length > 0 && (
            <Link to="/#collections" className="text-sm font-semibold text-neutral-700 hover:text-ink">
              Collections
            </Link>
          )}
          {settings.about.body.trim() && (
            <Link to="/#about" className="text-sm font-semibold text-neutral-700 hover:text-ink">
              About
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 border border-neutral-200 px-3 py-2 text-xs font-semibold hover:border-ink sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
            WhatsApp
          </a>
          <button onClick={cart.open} aria-label={`Open bag, ${cart.count} items`} className="relative p-2.5 hover:bg-neutral-100">
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[10px] font-bold text-gold-bright">
                {cart.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="p-2.5 hover:bg-neutral-100 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-neutral-200 bg-white px-5 py-4 md:hidden" aria-label="Mobile">
          <ul className="space-y-1 text-base">
            <li>
              <Link to="/shop" onClick={() => setMenuOpen(false)} className="block py-2 font-semibold">
                Shop all
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)} className="block py-2 text-neutral-600">
                  {c.name}
                </Link>
              </li>
            ))}
            {settings.about.body.trim() && (
              <li>
                <Link to="/#about" onClick={() => setMenuOpen(false)} className="block py-2 font-semibold">
                  About
                </Link>
              </li>
            )}
          </ul>
          <a href={chat} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-3 w-full">
            <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
            Chat on WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
