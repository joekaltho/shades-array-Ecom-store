import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from './AdminContext';
import { Field } from './ui';
import { Logo } from '../components/Logo';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <Logo variant="full" className="mx-auto mb-6 h-20 w-auto" />
          <h1 className="flex items-center justify-center gap-2 text-center text-xl font-bold">
            <Lock className="h-4 w-4 text-gold" aria-hidden /> Store admin
          </h1>
          <p className="mt-1 text-center text-sm text-neutral-500">Sign in to manage your products and orders.</p>

          {api?.mode === 'local' && (
            <p className="mt-4 bg-amber-50 p-3 text-xs text-amber-800">
              Dev mode: no Supabase keys found, so any email and password works and data stays in this browser.
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" data-autofocus />
            </Field>
            <Field label="Password" htmlFor="password">
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </Field>
            {error && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to the store
        </Link>
      </div>
    </div>
  );
}
