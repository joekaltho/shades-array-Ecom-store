import { Glasses } from 'lucide-react';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ProductImage({ src, alt, className = '', eager }: Props) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 text-neutral-300 ${className}`} role="img" aria-label={alt}>
        <Glasses className="h-1/4 w-1/4" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`bg-neutral-100 object-cover ${className}`}
    />
  );
}
