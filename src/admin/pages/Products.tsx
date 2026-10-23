import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminContext';
import { ConfirmDialog, EmptyState, PageHeader, ProductStatusBadge, Switch } from '../ui';
import { productToInput } from '../productForm';
import { useToast } from '../../context/ToastContext';
import { requireApi } from '../../lib/api';
import { LOW_STOCK_THRESHOLD } from '../../lib/availability';
import { formatNaira } from '../../lib/format';
import type { Product, ProductStatus } from '../../types';

type Filter = 'all' | ProductStatus;

export default function Products() {
  const { data, saveProduct, deleteProduct } = useAdminData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') as Filter | null) ?? 'all';
  const categoryFilter = params.get('category') ?? '';
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { products, categories } = data;
  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.status === 'active').length,
      draft: products.filter((p) => p.status === 'draft').length,
      archived: products.filter((p) => p.status === 'archived').length,
    }),
    [products],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (filter === 'all' || p.status === filter) &&
        (!categoryFilter || p.categoryId === categoryFilter) &&
        (!q || `${p.name} ${p.sku ?? ''}`.toLowerCase().includes(q)),
    );
  }, [products, filter, categoryFilter, query]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  async function patch(p: Product, change: Partial<Product>, success: string) {
    setBusyId(p.id);
    try {
      await saveProduct({ ...productToInput(p), ...change });
      toast.success(success);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusyId(null);
    }
  }

  function togglePublish(p: Product, live: boolean) {
    if (live && p.images.length === 0) {
      toast.error('Add a photo to this product before making it live.');
      return;
    }
    void patch(p, { status: live ? 'active' : 'draft' }, live ? `${p.name} is now live` : `${p.name} is now a draft`);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await deleteProduct(toDelete.id);
      void requireApi().deleteImages(toDelete.images).catch(() => undefined);
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setBusyId(null);
    }
  }

  const tabs: [Filter, string][] = [
    ['all', 'All'],
    ['active', 'Live'],
    ['draft', 'Drafts'],
    ['archived', 'Archived'],
  ];

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <Link to="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setParam('status', key === 'all' ? null : key)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-semibold ${filter === key ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              {label} <span className="opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or SKU" aria-label="Search products" className="input pl-9" />
          </div>
          <select value={categoryFilter} onChange={(e) => setParam('category', e.target.value || null)} aria-label="Filter by category" className="input w-auto">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products yet">
          <Link to="/admin/products/new" className="btn btn-primary btn-sm mt-2">
            Add your first product
          </Link>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title="No products match those filters" />
      ) : (
        <ul className="card divide-y divide-neutral-100">
          {visible.map((p) => {
            const category = categories.find((c) => c.id === p.categoryId);
            const low = p.status === 'active' && !p.allowPreorder && p.stock <= LOW_STOCK_THRESHOLD;
            return (
              <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <Link to={`/admin/products/${p.id}`} className="shrink-0">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="h-16 w-16 object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center bg-neutral-100 text-[10px] text-neutral-400">No photo</div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${p.id}`} className="block truncate text-sm font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {category?.name ?? 'No category'}
                    {p.sku ? ` · ${p.sku}` : ''}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="font-semibold">{formatNaira(p.price)}</span>
                    <span className={low ? 'font-semibold text-amber-700' : 'text-neutral-500'}>
                      {p.stock === 0 ? (p.allowPreorder ? 'Pre-order' : 'Sold out') : `${p.stock} in stock`}
                    </span>
                    <ProductStatusBadge status={p.status} />
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                  <button
                    onClick={() => void patch(p, { featured: !p.featured }, p.featured ? 'Removed from featured' : 'Added to featured')}
                    disabled={busyId === p.id}
                    aria-label={p.featured ? 'Remove from featured' : 'Feature on homepage'}
                    aria-pressed={p.featured}
                    title="Feature on homepage"
                    className="p-2 hover:bg-neutral-100"
                  >
                    <Star className={`h-4 w-4 ${p.featured ? 'fill-gold-bright text-gold-bright' : 'text-neutral-400'}`} />
                  </button>
                  <Switch checked={p.status === 'active'} disabled={busyId === p.id || p.status === 'archived'} onChange={(v) => togglePublish(p, v)} label={`${p.name} is live`} />
                  <Link to={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="p-2 text-neutral-600 hover:bg-neutral-100 hover:text-ink">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} className="hidden p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 sm:block">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this product?"
        message={
          <>
            <strong>{toDelete?.name}</strong> and its photos will be removed for good. Past orders keep their record of it. If you only want to hide it, make it a draft instead.
          </>
        }
        confirmLabel="Delete"
        danger
        busy={busyId === toDelete?.id}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
