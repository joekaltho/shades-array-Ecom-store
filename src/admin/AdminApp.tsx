import { Link, Route, Routes } from 'react-router-dom';
import { api } from '../lib/api';
import { AdminDataProvider, AuthProvider, useAuth } from './AdminContext';
import { AdminLayout } from './AdminLayout';
import { Login } from './Login';
import { Spinner } from './ui';
import Overview from './pages/Overview';
import Products from './pages/Products';
import ProductEditor from './pages/ProductEditor';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import SettingsPage from './pages/Settings';

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="mt-3 space-y-3 text-sm text-neutral-600">{children}</div>
      </div>
    </div>
  );
}

function Gate() {
  const { state, signOut } = useAuth();

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'out') return <Login />;

  if (!state.session.isAdmin) {
    return (
      <Centered title="No admin access">
        <p>
          You’re signed in as <strong>{state.session.email}</strong>, but this account isn’t an admin for the store.
        </p>
        <p>Ask the store owner to add your user id to the <code>admins</code> table.</p>
        <button onClick={() => void signOut()} className="btn btn-outline btn-sm">
          Sign out
        </button>
      </Centered>
    );
  }

  return (
    <AdminDataProvider>
      <AdminLayout>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <p className="py-20 text-center text-sm text-neutral-500">
                That admin page doesn’t exist. <Link to="/admin" className="underline">Go to overview</Link>
              </p>
            }
          />
        </Routes>
      </AdminLayout>
    </AdminDataProvider>
  );
}

export default function AdminApp() {
  if (!api) {
    return (
      <Centered title="Backend not connected">
        <p>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables and redeploy.
        </p>
      </Centered>
    );
  }
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
