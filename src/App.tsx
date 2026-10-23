import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import NotFound from './pages/NotFound';

// The admin is a separate chunk, so shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="p-10 text-center text-sm text-neutral-500">Loading…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          element={
            <StoreProvider>
              <CartProvider>
                <Layout />
              </CartProvider>
            </StoreProvider>
          }
        >
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
