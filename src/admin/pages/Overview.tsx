import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { useAdminData } from '../AdminContext';
import { OrderStatusBadge, PageHeader } from '../ui';
import { LOW_STOCK_THRESHOLD } from '../../lib/availability';
import { formatNaira, timeAgo } from '../../lib/format';

export default function Overview() {
  const { data } = useAdminData();
  const { products, orders } = data;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const newOrders = orders.filter((o) => o.status === 'new');
  const monthRevenue = orders
    .filter((o) => (o.status === 'paid' || o.status === 'delivered') && new Date(o.createdAt) >= monthStart)
    .reduce((sum, o) => sum + o.total, 0);
  const live = products.filter((p) => p.status === 'active');
  const lowStock = live
    .filter((p) => !p.allowPreorder && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const kpis = [
    { label: 'New orders', value: String(newOrders.length), hint: 'Waiting for you', to: '/admin/orders?status=new', icon: ShoppingCart },
    { label: 'Revenue this month', value: formatNaira(monthRevenue), hint: 'Paid and delivered orders', to: '/admin/orders', icon: TrendingUp },
    { label: 'Live products', value: String(live.length), hint: `${products.length - live.length} draft or archived`, to: '/admin/products', icon: Package },
    { label: 'Running low', value: String(lowStock.length), hint: `${LOW_STOCK_THRESHOLD} or fewer left`, to: '/admin/products', icon: AlertTriangle },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <Link to="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="card p-4 transition-colors hover:border-ink sm:p-5">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold">{k.label}</span>
              <k.icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{k.value}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{k.hint}</p>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="card mt-6 p-8 text-center">
          <p className="font-semibold">Your catalogue is empty</p>
          <p className="mt-1 text-sm text-neutral-500">Add your first product and publish it to put it on the store.</p>
          <Link to="/admin/products/new" className="btn btn-primary btn-sm mt-4">
            Add your first product
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-bold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-neutral-500 hover:text-ink">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">
              No orders yet. They appear here when someone taps “Order on WhatsApp”.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/orders?open=${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-neutral-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        #{o.number} <span className="font-normal text-neutral-500">· {o.customerName || 'No name yet'}</span>
                      </p>
                      <p className="text-xs text-neutral-500">{timeAgo(o.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold">{formatNaira(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-bold">Running low</h2>
            <Link to="/admin/products" className="text-xs font-semibold text-neutral-500 hover:text-ink">
              All products
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">Everything live is well stocked.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50">
                    {p.images[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 bg-neutral-100" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {p.stock === 0 ? 'Sold out' : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
