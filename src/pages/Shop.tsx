import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDocumentTitle } from '../lib/hooks';
import { canPurchase } from '../lib/availability';
import { ProductCard } from '../components/ProductCard';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export default function Shop() {
  const { products, categories } = useStore();
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get('category') ?? 'all';
  const query = params.get('q') ?? '';
  const sort = (params.get('sort') as Sort | null) ?? 'featured';
  const inStockOnly = params.get('stock') === '1';
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  useDocumentTitle(activeCategory ? activeCategory.name : 'Shop');

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCategory && p.categoryId !== activeCategory.id) return false;
      if (inStockOnly && !canPurchase(p)) return false;
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const byNewest = (a: (typeof list)[number], b: (typeof list)[number]) => b.createdAt.localeCompare(a.createdAt);
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return [...list].sort(byNewest);
      default:
        return [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || byNewest(a, b));
    }
  }, [products, activeCategory, inStockOnly, query, sort]);

  const pill = (active: boolean) =>
    `whitespace-nowrap px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-ink text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-ink'
    }`;

  return (
    <div className="container-wide py-12 lg:py-16">
      <h1 className="font-display text-5xl sm:text-6xl">{activeCategory ? activeCategory.name : 'All sunglasses'}</h1>
      {activeCategory?.tagline && <p className="mt-2 text-neutral-600">{activeCategory.tagline}</p>}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Categories">
          <button role="tab" aria-selected={!activeCategory} className={pill(!activeCategory)} onClick={() => setParam('category', null)}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} role="tab" aria-selected={activeCategory?.id === c.id} className={pill(activeCategory?.id === c.id)} onClick={() => setParam('category', c.slug)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setParam('q', e.target.value || null)}
              placeholder="Search"
              aria-label="Search sunglasses"
              className="input pl-9"
            />
          </div>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value === 'featured' ? null : e.target.value)} aria-label="Sort" className="input w-auto">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setParam('stock', e.target.checked ? '1' : null)} className="h-4 w-4 accent-black" />
            Available only
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-neutral-500" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'style' : 'styles'}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-600">{products.length === 0 ? 'New styles are on the way.' : 'Nothing matches those filters.'}</p>
          {products.length > 0 && (
            <button onClick={() => setParams({}, { replace: true })} className="btn btn-outline mt-4">
              <X className="h-4 w-4" aria-hidden /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
