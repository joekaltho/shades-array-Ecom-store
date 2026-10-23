import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminContext';
import { ConfirmDialog, EmptyState, Field, PageHeader } from '../ui';
import { ImageUploader } from '../ImageUploader';
import { Overlay } from '../../components/Overlay';
import { useToast } from '../../context/ToastContext';
import { requireApi } from '../../lib/api';
import { slugify } from '../../lib/format';
import type { Category } from '../../types';

interface Draft {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  imageUrl: string | null;
}

const blank: Draft = { name: '', slug: '', tagline: '', description: '', imageUrl: null };

export default function Categories() {
  const { data, saveCategory, deleteCategory, reorderCategories } = useAdminData();
  const toast = useToast();
  const { categories, products } = data;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const countFor = (id: string) => products.filter((p) => p.categoryId === id).length;

  function openEditor(c?: Category) {
    setDraft(c ? { id: c.id, name: c.name, slug: c.slug, tagline: c.tagline, description: c.description, imageUrl: c.imageUrl } : blank);
    setOriginalImage(c?.imageUrl ?? null);
    setSlugTouched(Boolean(c));
    setError('');
    setUploaded([]);
  }

  function closeEditor() {
    // Throw away photos uploaded in this session that were not saved.
    if (uploaded.length) void requireApi().deleteImages(uploaded).catch(() => undefined);
    setDraft(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) return setError('Give the category a name.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) return setError('The URL name must be lowercase letters, numbers and dashes.');
    setSaving(true);
    setError('');
    try {
      const existing = draft.id ? categories.find((c) => c.id === draft.id) : undefined;
      await saveCategory({
        id: draft.id,
        name: draft.name.trim(),
        slug: draft.slug,
        tagline: draft.tagline.trim(),
        description: draft.description.trim(),
        imageUrl: draft.imageUrl,
        sortOrder: existing?.sortOrder ?? categories.length + 1,
      });
      const stale = [originalImage, ...uploaded].filter((u): u is string => Boolean(u) && u !== draft.imageUrl);
      if (stale.length) void requireApi().deleteImages(stale).catch(() => undefined);
      toast.success(draft.id ? 'Category saved' : 'Category added');
      setUploaded([]);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const ids = categories.map((c) => c.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderCategories(ids);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder.');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setSaving(true);
    try {
      await deleteCategory(toDelete.id);
      if (toDelete.imageUrl) void requireApi().deleteImages([toDelete.imageUrl]).catch(() => undefined);
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Groups shown under “Shop by style” and in the shop filters. Only categories with live products appear on the homepage."
        actions={
          <button onClick={() => openEditor()} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> Add category
          </button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title="No categories yet">Add a few so shoppers can browse by style.</EmptyState>
      ) : (
        <ul className="card divide-y divide-neutral-100">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-14 w-14 shrink-0 object-cover" /> : <div className="h-14 w-14 shrink-0 bg-neutral-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-xs text-neutral-500">{c.tagline || `/${c.slug}`}</p>
                <p className="text-xs text-neutral-400">{countFor(c.id)} {countFor(c.id) === 1 ? 'product' : 'products'}</p>
              </div>
              <div className="flex shrink-0 items-center">
                <button onClick={() => void move(i, -1)} disabled={i === 0} aria-label={`Move ${c.name} up`} className="p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-25">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => void move(i, 1)} disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`} className="p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-25">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button onClick={() => openEditor(c)} aria-label={`Edit ${c.name}`} className="p-2 text-neutral-600 hover:bg-neutral-100 hover:text-ink">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`} className="p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Overlay open={Boolean(draft)} onClose={closeEditor} title={draft?.id ? 'Edit category' : 'New category'} variant="modal" widthClass="max-w-lg">
        {draft && (
          <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="overflow-y-auto p-6">
              <h2 className="pr-8 text-lg font-bold">{draft.id ? 'Edit category' : 'New category'}</h2>
              <div className="mt-5 space-y-4">
                <Field label="Name" htmlFor="c-name">
                  <input
                    id="c-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: slugTouched ? draft.slug : slugify(e.target.value) })}
                    className="input"
                    data-autofocus
                  />
                </Field>
                <Field label="Short tagline" htmlFor="c-tagline" hint="One line shown on the homepage card.">
                  <input id="c-tagline" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className="input" />
                </Field>
                <Field label="URL name" htmlFor="c-slug" hint={`/shop?category=${draft.slug || '…'}`}>
                  <input
                    id="c-slug"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setDraft({ ...draft, slug: e.target.value.toLowerCase() });
                    }}
                    className="input"
                  />
                </Field>
                <div>
                  <span className="label">Card photo</span>
                  <div className="max-w-[10rem]">
                    <ImageUploader
                      images={draft.imageUrl ? [draft.imageUrl] : []}
                      onChange={(imgs) => setDraft({ ...draft, imageUrl: imgs[0] ?? null })}
                      onUploaded={(u) => setUploaded((x) => [...x, u])}
                      folder="categories"
                      max={1}
                      label="Add photo"
                    />
                  </div>
                </div>
              </div>
              {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
              <button type="button" onClick={closeEditor} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Overlay>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this category?"
        message={
          <>
            <strong>{toDelete?.name}</strong> will be removed.{' '}
            {toDelete && countFor(toDelete.id) > 0
              ? `Its ${countFor(toDelete.id)} product${countFor(toDelete.id) === 1 ? '' : 's'} will stay on the store but have no category.`
              : 'No products use it.'}
          </>
        }
        confirmLabel="Delete"
        danger
        busy={saving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
