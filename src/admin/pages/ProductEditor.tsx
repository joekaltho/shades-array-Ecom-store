import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminContext';
import { Card, ConfirmDialog, Field } from '../ui';
import { ImageUploader } from '../ImageUploader';
import { slugify, toDraft, toInput, validateProduct, type ProductDraft, type ProductErrors } from '../productForm';
import { useToast } from '../../context/ToastContext';
import { requireApi } from '../../lib/api';
import type { Product } from '../../types';

export default function ProductEditor() {
  const { id } = useParams();
  const { data } = useAdminData();
  const existing = id ? data.products.find((p) => p.id === id) : undefined;

  if (id && !existing) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">Product not found</p>
        <Link to="/admin/products" className="btn btn-outline btn-sm mt-4">
          Back to products
        </Link>
      </div>
    );
  }
  // Re-mount the form when switching between products.
  return <EditorForm key={id ?? 'new'} existing={existing} />;
}

function EditorForm({ existing }: { existing?: Product }) {
  const { data, saveProduct, deleteProduct } = useAdminData();
  const toast = useToast();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(existing));
  const [errors, setErrors] = useState<ProductErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'discard' | 'delete' | null>(null);
  const initial = useRef(JSON.stringify(draft));
  const slugTouched = useRef(Boolean(existing));
  const uploaded = useRef<string[]>([]);
  const dirty = JSON.stringify(draft) !== initial.current;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const discardUploads = (keep: string[] = []) => {
    const orphans = uploaded.current.filter((u) => !keep.includes(u));
    if (orphans.length) void requireApi().deleteImages(orphans).catch(() => undefined);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateProduct(draft);
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      document.getElementById(`f-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Fix the highlighted fields and try again.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProduct(toInput(draft, existing?.id));
      // Delete photos that were removed, and uploads that never made it into the saved product.
      const removed = (existing?.images ?? []).filter((u) => !saved.images.includes(u));
      if (removed.length) void requireApi().deleteImages(removed).catch(() => undefined);
      discardUploads(saved.images);
      toast.success(existing ? 'Changes saved' : `${saved.name} added`);
      initial.current = JSON.stringify(draft);
      navigate('/admin/products');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save.';
      if (message.includes('URL name')) setErrors((x) => ({ ...x, slug: message }));
      toast.error(message);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    setSaving(true);
    try {
      await deleteProduct(existing.id);
      void requireApi().deleteImages(existing.images).catch(() => undefined);
      discardUploads();
      initial.current = JSON.stringify(draft);
      toast.success(`${existing.name} deleted`);
      navigate('/admin/products');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete.');
      setSaving(false);
    }
  }

  const leave = () => {
    if (dirty) setConfirm('discard');
    else navigate('/admin/products');
  };

  const err = (k: keyof ProductDraft) => errors[k];
  const bad = (k: keyof ProductDraft) => (errors[k] ? 'border-red-500' : '');

  return (
    <form onSubmit={onSubmit} noValidate>
      <button type="button" onClick={leave} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Products
      </button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{existing ? existing.name : 'New product'}</h1>
        {existing?.status === 'active' && (
          <a href={`/product/${existing.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-ink">
            View on store <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Basics">
            <div className="space-y-4">
              <Field label="Name" htmlFor="f-name" error={err('name')}>
                <input
                  id="f-name"
                  value={draft.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (!slugTouched.current) setDraft((d) => ({ ...d, slug: slugify(e.target.value) }));
                  }}
                  placeholder="e.g. Aureate Aviator"
                  className={`input ${bad('name')}`}
                  autoFocus={!existing}
                />
              </Field>
              <Field label="Description" htmlFor="f-description" hint="Shown on the product page. Keep it short and true.">
                <textarea id="f-description" rows={5} value={draft.description} onChange={(e) => set('description', e.target.value)} className="input" />
              </Field>
            </div>
          </Card>

          <Card title="Photos" description="The first photo is the main one. Large photos are resized automatically.">
            <div id="f-images">
              <ImageUploader
                images={draft.images}
                onChange={(imgs) => set('images', imgs)}
                onUploaded={(u) => uploaded.current.push(u)}
                folder="products"
                max={8}
              />
              {errors.images && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{errors.images}</p>}
            </div>
          </Card>

          <Card title="Details" description="Optional. Only filled-in rows are shown to shoppers.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frame" htmlFor="f-frame"><input id="f-frame" value={draft.frame} onChange={(e) => set('frame', e.target.value)} placeholder="e.g. Black / gold" className="input" /></Field>
              <Field label="Lens" htmlFor="f-lens"><input id="f-lens" value={draft.lens} onChange={(e) => set('lens', e.target.value)} placeholder="e.g. Smoke grey, polarised" className="input" /></Field>
              <Field label="Material" htmlFor="f-material"><input id="f-material" value={draft.material} onChange={(e) => set('material', e.target.value)} className="input" /></Field>
              <Field label="UV protection" htmlFor="f-uv"><input id="f-uv" value={draft.uv} onChange={(e) => set('uv', e.target.value)} placeholder="e.g. UV400" className="input" /></Field>
              <Field label="Size" htmlFor="f-size" hint="e.g. 54-19-145 (lens-bridge-temple, mm)"><input id="f-size" value={draft.size} onChange={(e) => set('size', e.target.value)} className="input" /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-4">
              <Field label="Status" htmlFor="f-status" hint={draft.status === 'active' ? 'Visible on the store.' : draft.status === 'draft' ? 'Hidden from shoppers. Safe to keep editing.' : 'Hidden, kept for your records.'}>
                <select id="f-status" value={draft.status} onChange={(e) => set('status', e.target.value as ProductDraft['status'])} className="input">
                  <option value="draft">Draft</option>
                  <option value="active">Live</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-black" />
                Feature on the homepage
              </label>
              <Field label="Badge" htmlFor="f-badge" hint="Small label on the product, e.g. New or Limited.">
                <input id="f-badge" maxLength={24} value={draft.badge} onChange={(e) => set('badge', e.target.value)} className="input" />
              </Field>
            </div>
          </Card>

          <Card title="Price and stock">
            <div className="space-y-4">
              <Field label="Price (₦)" htmlFor="f-price" error={err('price')}>
                <input id="f-price" inputMode="numeric" value={draft.price} onChange={(e) => set('price', e.target.value)} placeholder="38000" className={`input ${bad('price')}`} />
              </Field>
              <Field label="Old price (₦)" htmlFor="f-compareAtPrice" error={err('compareAtPrice')} hint="Optional. Shown crossed out to advertise a discount.">
                <input id="f-compareAtPrice" inputMode="numeric" value={draft.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} className={`input ${bad('compareAtPrice')}`} />
              </Field>
              <Field label="In stock" htmlFor="f-stock" error={err('stock')}>
                <input id="f-stock" inputMode="numeric" value={draft.stock} onChange={(e) => set('stock', e.target.value)} className={`input ${bad('stock')}`} />
              </Field>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" checked={draft.allowPreorder} onChange={(e) => set('allowPreorder', e.target.checked)} className="mt-0.5 h-4 w-4 accent-black" />
                <span>
                  Take pre-orders when sold out
                  <span className="hint block">Shoppers can still order at 0 stock.</span>
                </span>
              </label>
              <Field label="SKU" htmlFor="f-sku" hint="Optional internal code.">
                <input id="f-sku" value={draft.sku} onChange={(e) => set('sku', e.target.value)} className="input" />
              </Field>
            </div>
          </Card>

          <Card title="Organise">
            <div className="space-y-4">
              <Field label="Category" htmlFor="f-categoryId">
                <select id="f-categoryId" value={draft.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input">
                  <option value="">No category</option>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Page URL" htmlFor="f-slug" error={err('slug')} hint={`/product/${draft.slug || '…'}`}>
                <input
                  id="f-slug"
                  value={draft.slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    set('slug', e.target.value.toLowerCase());
                  }}
                  className={`input ${bad('slug')}`}
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-14 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:mx-0 sm:border sm:px-5 md:bottom-4">
        {existing ? (
          <button type="button" onClick={() => setConfirm('delete')} className="btn btn-danger btn-sm" disabled={saving}>
            <Trash2 className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Delete</span>
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={leave} className="btn btn-outline btn-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm px-6" disabled={saving || (Boolean(existing) && !dirty)}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'discard'}
        title="Discard your changes?"
        message="You have unsaved changes. If you leave now they will be lost."
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          discardUploads();
          initial.current = JSON.stringify(draft);
          navigate('/admin/products');
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this product?"
        message={<>This removes <strong>{existing?.name}</strong> and its photos for good. To just hide it, set its status to Draft instead.</>}
        confirmLabel="Delete"
        danger
        busy={saving}
        onConfirm={() => void onDelete()}
        onCancel={() => setConfirm(null)}
      />
    </form>
  );
}
