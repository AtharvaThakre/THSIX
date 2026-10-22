import { ArrowRight } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import ScrollVelocity from '../ScrollVelocity/ScrollVelocity';
import { ProductCarousel } from '../ProductCarousel/ProductCarousel';
import type { ProductCardData } from '../ProductCard/ProductCard';
import './ProductShowcase.css';

export type ShowcaseProduct = ProductCardData;

export interface ShowcaseCollection {
  id: string;
  handle: string;
  title: string;
  products: ShowcaseProduct[];
}

interface ProductRowProps {
  title: string;
  products: ShowcaseProduct[];
  /** Collection handle; when set, the row heading links to the full collection. */
  handle?: string;
}

/** One titled carousel: a heading with a rule (and a "View all" link for collections). */
const ProductRow = ({ title, products, handle }: ProductRowProps) => {
  const headingId = useId();

  return (
    <div className="product-showcase__row" role="group" aria-labelledby={headingId}>
      <div className="product-showcase__row-head">
        <h3 className="product-showcase__row-title" id={headingId}>
          {title}
        </h3>
        <span className="product-showcase__row-rule" aria-hidden="true" />
        {handle ? (
          <Link className="product-showcase__view-all" to={`/collections/${handle}`} prefetch="intent">
            View all
            <ArrowRight className="product-showcase__view-all-arrow" size={14} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <ProductCarousel label={title} products={products} />
    </div>
  );
};

interface ProductShowcaseProps {
  products: ShowcaseProduct[];
  collections: ShowcaseCollection[];
  /** The Storefront API request failed (products/collections are empty). */
  error?: boolean;
}

export const ProductShowcase = ({ products, collections, error = false }: ProductShowcaseProps) => {
  const isEmpty = products.length === 0 && collections.length === 0;

  return (
    <section className="product-showcase" id="shop">

      {/* "1st drop is now live." Announcement Section */}
      <div className="product-showcase__announcement">
        <ScrollVelocity
          texts={['1ˢᵗ drop is now live.']}
          velocity={50}
          className="announcement-text"
          numCopies={8}
          parallaxClassName="announcement-parallax"
          scrollerClassName="announcement-scroller"
        />
      </div>

      {/* Section header */}
      <div className="product-showcase__header">
        <div className="product-showcase__header-left">
          <span className="product-showcase__eyebrow">THE STORE</span>
          <h2 className="product-showcase__title">LATEST DROPS</h2>
          <p className="product-showcase__subtitle">SNEAKER. CULTURE. COMMUNITY.</p>
        </div>
      </div>

      {isEmpty ? (
        <p className="product-showcase__empty" role={error ? 'alert' : undefined}>
          {error ? 'Products are unavailable right now.' : 'New drops coming soon.'}
        </p>
      ) : (
        <>
          {/* All products, then one row per (non-empty) Shopify collection */}
          {products.length > 0 ? <ProductRow title="All Products" products={products} /> : null}
          {collections.map((collection) => (
            <ProductRow
              key={collection.id}
              title={collection.title}
              products={collection.products}
              handle={collection.handle}
            />
          ))}
        </>
      )}
    </section>
  );
};
