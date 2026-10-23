interface LogoProps {
  /** "wordmark" = name only (header, sidebar). "full" = name plus tagline. */
  variant?: 'wordmark' | 'full';
  alt?: string;
  className?: string;
}

const FILES = {
  wordmark: { src: '/brand/logo-wordmark.png', width: 560, height: 158 },
  full: { src: '/brand/logo.png', width: 720, height: 231 },
} as const;

export function Logo({ variant = 'wordmark', alt = 'Shades Array', className = '' }: LogoProps) {
  const f = FILES[variant];
  return <img src={f.src} width={f.width} height={f.height} alt={alt} className={className} decoding="async" />;
}
