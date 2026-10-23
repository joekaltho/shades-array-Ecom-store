import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { useStore } from '../context/StoreContext';
import { buildGeneralMessage, whatsappLink } from '../lib/whatsapp';

function ScrollManager() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash, search]);
  return null;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="text-sm leading-relaxed text-neutral-600">{children}</div>
    </div>
  );
}

function StoreGate() {
  const { status, error, reload } = useStore();
  if (status === 'unconfigured') {
    return (
      <Notice title="Store not connected">
        <p>This site is missing its Supabase settings. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the environment and redeploy.</p>
      </Notice>
    );
  }
  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-ink" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <Notice title="We couldn’t load the store">
        <p>{error ?? 'Please check your connection and try again.'}</p>
        <button onClick={reload} className="btn btn-primary mt-4">Try again</button>
      </Notice>
    );
  }
  return <Outlet />;
}

export function Layout() {
  const { settings } = useStore();
  const { announcement } = settings;

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      {announcement.enabled && announcement.text.trim() && (
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white">{announcement.text}</div>
      )}
      <Navbar />
      <main className="flex-1">
        <StoreGate />
      </main>
      <Footer />
      <CartDrawer />
      <a
        href={whatsappLink(settings.whatsapp, buildGeneralMessage(settings.brandName))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
}
