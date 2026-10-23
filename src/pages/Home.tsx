import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDocumentTitle } from '../lib/hooks';
import { buildGeneralMessage, whatsappLink } from '../lib/whatsapp';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';

// Full class names so Tailwind can see them. Picks the column count from how many categories there are,
// so the row always fills the width instead of leaving an empty column.
const CATEGORY_COLUMNS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
};

export default function Home() {
  const { settings, products, categories } = useStore();
  useDocumentTitle();

  const featured = products.filter((p) => p.featured);
  const showcase = (featured.length > 0 ? featured : products).slice(0, 6);
  const shownCategories = categories.filter((c) => products.some((p) => p.categoryId === c.id));
  const aboutParagraphs = settings.about.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="container-wide grid items-center gap-10 py-14 lg:min-h-[40rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-20">
          <div>
            <h1 className="font-display text-6xl leading-[1.02] sm:text-7xl xl:text-8xl">{settings.hero.headline}</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-neutral-600">{settings.hero.subheadline}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/shop" className="btn btn-primary px-9 py-4 text-base">
                Shop the collection <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <a
                href={whatsappLink(settings.whatsapp, buildGeneralMessage(settings.brandName))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline px-7 py-4 text-base"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden />
                Chat with us
              </a>
            </div>
          </div>
          <ProductImage src={settings.hero.imageUrl} alt="" eager className="aspect-[4/3] w-full" />
        </div>
      </section>

      {/* Featured */}
      <section className="container-wide py-20 lg:py-28">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-display text-5xl lg:text-6xl">{featured.length > 0 ? 'Featured' : 'Latest'}</h2>
          {products.length > 0 && (
            <Link to="/shop" className="inline-flex items-center gap-1.5 text-base font-semibold hover:text-gold">
              View all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
        {showcase.length === 0 ? (
          <p className="border border-dashed border-neutral-300 bg-white p-14 text-center text-base text-neutral-500">
            New styles are on the way. Check back soon, or message us on WhatsApp.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Collections */}
      {shownCategories.length > 0 && (
        <section id="collections" className="scroll-mt-24 border-y border-neutral-200 bg-white">
          <div className="container-wide py-20 lg:py-28">
            <h2 className="mb-10 font-display text-5xl lg:text-6xl">Shop by style</h2>
            <div className={`grid gap-6 sm:grid-cols-2 ${CATEGORY_COLUMNS[shownCategories.length] ?? 'lg:grid-cols-4'}`}>
              {shownCategories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-neutral-900">
                  <ProductImage
                    src={c.imageUrl}
                    alt=""
                    className="h-full w-full opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <h3 className="font-display text-4xl">{c.name}</h3>
                    {c.tagline && <p className="mt-1.5 text-base text-white/85">{c.tagline}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {aboutParagraphs.length > 0 && (
        <section id="about" className="mx-auto max-w-4xl scroll-mt-24 px-5 py-20 text-center sm:px-8 lg:py-28">
          <h2 className="font-display text-5xl lg:text-6xl">{settings.about.title}</h2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-neutral-600">
            {aboutParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
