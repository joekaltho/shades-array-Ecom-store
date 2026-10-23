import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/hooks';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-5xl">404</h1>
      <p className="text-sm text-neutral-600">That page doesn’t exist.</p>
      <Link to="/" className="btn btn-primary">Back to the store</Link>
    </div>
  );
}
