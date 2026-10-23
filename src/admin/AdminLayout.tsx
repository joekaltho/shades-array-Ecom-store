import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, LogOut, Package, Settings as SettingsIcon, ShoppingCart, Tags } from 'lucide-react';
import { useAdminData, useAuth } from './AdminContext';
import { Spinner } from './ui';
import { Logo } from '../components/Logo';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { state, signOut } = useAuth();
  const { data, error, reload } = useAdminData();
  const email = state.status === 'in' ? state.session.email : '';
  const newOrders = data?.orders.filter((o) => o.status === 'new').length ?? 0;

  const items = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: newOrders },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const link = (mobile: boolean) => ({ isActive }: { isActive: boolean }) =>
    mobile
      ? `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-ink' : 'text-neutral-500'}`
      : `flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-ink'
        }`;

  const badge = (n: number) =>
    n > 0 && (
      <span className="ml-auto bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white max-md:absolute max-md:right-3 max-md:top-1 max-md:ml-0">
        {n}
      </span>
    );

  return (
    <div className="min-h-screen bg-neutral-50 text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="border-b border-neutral-200 px-5 py-5">
          <Logo alt={data?.settings.brandName ?? 'Shades Array'} className="h-10 w-auto" />
          <p className="mt-1 text-xs text-neutral-500">Store admin</p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={link(false)}>
              <it.icon className="h-4 w-4" aria-hidden />
              {it.label}
              {it.badge ? badge(it.badge) : null}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-neutral-200 p-3 text-sm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-ink">
            <ExternalLink className="h-4 w-4" aria-hidden /> View store
          </a>
          <button onClick={() => void signOut()} className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-ink">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
          {email && <p className="truncate px-3 pt-1 text-xs text-neutral-400">{email}</p>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <Logo alt={data?.settings.brandName ?? 'Shades Array'} className="h-8 w-auto" />
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="View store" className="p-2 text-neutral-600">
            <ExternalLink className="h-5 w-5" />
          </a>
          <button onClick={() => void signOut()} aria-label="Sign out" className="p-2 text-neutral-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-8 sm:py-8 md:pb-10">
          {error && !data ? (
            <div className="card p-8 text-center">
              <p className="font-semibold">Couldn’t load your store data</p>
              <p className="mt-1 text-sm text-neutral-500">{error}</p>
              <button onClick={() => void reload()} className="btn btn-primary btn-sm mt-4">
                Try again
              </button>
            </div>
          ) : !data ? (
            <Spinner />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white md:hidden" aria-label="Admin">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={link(true)}>
            <it.icon className="h-5 w-5" aria-hidden />
            {it.label}
            {it.badge ? badge(it.badge) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
