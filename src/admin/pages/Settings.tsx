import { useRef, useState, type FormEvent } from 'react';
import { useAdminData } from '../AdminContext';
import { Card, Field, PageHeader } from '../ui';
import { ImageUploader } from '../ImageUploader';
import { useToast } from '../../context/ToastContext';
import { requireApi } from '../../lib/api';
import { displayPhone, normalizePhone } from '../../lib/format';
import type { Settings } from '../../types';

export default function SettingsPage() {
  const { data, saveSettings } = useAdminData();
  const toast = useToast();
  const [form, setForm] = useState<Settings>(data.settings);
  const [phoneInput, setPhoneInput] = useState(displayPhone(data.settings.whatsapp));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initial = useRef(JSON.stringify(data.settings));
  const originalHero = useRef(data.settings.hero.imageUrl);
  const uploaded = useRef<string[]>([]);
  const dirty = JSON.stringify(form) !== initial.current || normalizePhone(phoneInput) !== form.whatsapp;

  const patch = (p: Partial<Settings>) => setForm((f) => ({ ...f, ...p }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const whatsapp = normalizePhone(phoneInput);
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      setError('Enter a valid WhatsApp number, including the country code if it is not a Nigerian number.');
      document.getElementById('s-whatsapp')?.focus();
      return;
    }
    if (!form.brandName.trim()) return setError('The store name can’t be empty.');
    setError('');
    setSaving(true);
    try {
      const saved = await saveSettings({ ...form, whatsapp, brandName: form.brandName.trim() });
      const stale = [originalHero.current, ...uploaded.current].filter((u) => u && u !== saved.hero.imageUrl && !u.startsWith('/images/'));
      if (stale.length) void requireApi().deleteImages(stale).catch(() => undefined);
      originalHero.current = saved.hero.imageUrl;
      uploaded.current = [];
      initial.current = JSON.stringify(saved);
      setForm(saved);
      setPhoneInput(displayPhone(saved.whatsapp));
      toast.success('Settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Settings" subtitle="What shoppers see across your store." />

      <div className="space-y-6">
        <Card title="Business">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" htmlFor="s-brand">
              <input id="s-brand" value={form.brandName} onChange={(e) => patch({ brandName: e.target.value })} className="input" />
            </Field>
            <Field label="Tagline" htmlFor="s-tagline" hint="Used in the browser tab title.">
              <input id="s-tagline" value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} className="input" />
            </Field>
            <Field label="WhatsApp number" htmlFor="s-whatsapp" hint="Orders are sent here. e.g. 0803 249 8333">
              <input id="s-whatsapp" inputMode="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="input" />
            </Field>
            <Field label="Instagram" htmlFor="s-instagram" hint="Your handle, e.g. @shadesarray. Leave empty to hide it.">
              <input id="s-instagram" value={form.instagram} onChange={(e) => patch({ instagram: e.target.value })} className="input" />
            </Field>
            <Field label="Email" htmlFor="s-email" hint="Leave empty to hide it.">
              <input id="s-email" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} className="input" />
            </Field>
            <Field label="Address or area" htmlFor="s-address" hint="Leave empty to hide it.">
              <input id="s-address" value={form.address} onChange={(e) => patch({ address: e.target.value })} className="input" />
            </Field>
          </div>
        </Card>

        <Card title="Homepage" description="The big banner at the top of the store.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline" htmlFor="s-headline" className="sm:col-span-2">
              <input id="s-headline" value={form.hero.headline} onChange={(e) => patch({ hero: { ...form.hero, headline: e.target.value } })} className="input" />
            </Field>
            <Field label="Subheading" htmlFor="s-sub" className="sm:col-span-2">
              <textarea id="s-sub" rows={2} value={form.hero.subheadline} onChange={(e) => patch({ hero: { ...form.hero, subheadline: e.target.value } })} className="input" />
            </Field>
            <div className="sm:col-span-2">
              <span className="label">Banner photo</span>
              <div className="max-w-[12rem]">
                <ImageUploader
                  images={form.hero.imageUrl ? [form.hero.imageUrl] : []}
                  onChange={(imgs) => patch({ hero: { ...form.hero, imageUrl: imgs[0] ?? '/images/hero.jpg' } })}
                  onUploaded={(u) => uploaded.current.push(u)}
                  folder="site"
                  max={1}
                  label="Change photo"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Announcement bar" description="A thin strip above the menu. Good for a sale or delivery notice.">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.announcement.enabled}
              onChange={(e) => patch({ announcement: { ...form.announcement, enabled: e.target.checked } })}
              className="h-4 w-4 accent-black"
            />
            Show the announcement bar
          </label>
          <Field label="Message" htmlFor="s-ann" className="mt-4">
            <input id="s-ann" value={form.announcement.text} onChange={(e) => patch({ announcement: { ...form.announcement, text: e.target.value } })} className="input" />
          </Field>
        </Card>

        <Card title="About and delivery">
          <div className="space-y-4">
            <Field label="About heading" htmlFor="s-about-title">
              <input id="s-about-title" value={form.about.title} onChange={(e) => patch({ about: { ...form.about, title: e.target.value } })} className="input" />
            </Field>
            <Field label="About text" htmlFor="s-about" hint="Leave empty to hide the About section. Separate paragraphs with a blank line.">
              <textarea id="s-about" rows={5} value={form.about.body} onChange={(e) => patch({ about: { ...form.about, body: e.target.value } })} className="input" />
            </Field>
            <Field label="Delivery note" htmlFor="s-delivery" hint="Shown in the bag and on product pages. Only say what you’re sure you offer. Leave empty to hide it.">
              <input id="s-delivery" value={form.deliveryNote} onChange={(e) => patch({ deliveryNote: e.target.value })} className="input" />
            </Field>
            <Field label="Footer blurb" htmlFor="s-footer" hint="One or two sentences under your name in the footer. Leave empty to hide it.">
              <textarea id="s-footer" rows={2} value={form.footerBlurb} onChange={(e) => patch({ footerBlurb: e.target.value })} className="input" />
            </Field>
          </div>
        </Card>

        <PasswordCard />
      </div>

      <div className="sticky bottom-14 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:mx-0 sm:border sm:px-5 md:bottom-4">
        <p className={`text-sm ${error ? 'font-medium text-red-600' : 'text-neutral-500'}`} role={error ? 'alert' : undefined}>
          {error || (dirty ? 'You have unsaved changes.' : 'All changes saved.')}
        </p>
        <button type="submit" disabled={saving || !dirty} className="btn btn-primary btn-sm px-6">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function change() {
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    setError('');
    try {
      await requireApi().updatePassword(password);
      setPassword('');
      setConfirm('');
      toast.success('Password changed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change password">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="pw-new">
          <input id="pw-new" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </Field>
        <Field label="Repeat it" htmlFor="pw-confirm">
          <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
      <button type="button" onClick={() => void change()} disabled={busy || !password} className="btn btn-outline btn-sm mt-4">
        {busy ? 'Changing…' : 'Change password'}
      </button>
    </Card>
  );
}
