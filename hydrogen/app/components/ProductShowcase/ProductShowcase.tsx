import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import type { HomeProductsQuery } from 'storefrontapi.generated';
import ScrollVelocity from '../ScrollVelocity/ScrollVelocity';
import { buildShopifySrcSet, transformShopifyImageUrl } from '../../utils/shopify-image-transform';
import './ProductShowcase.css';

export type ShowcaseProduct = HomeProductsQuery['products']['nodes'][number];

const formatMoney = (amount: string, currencyCode: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(parseFloat(amount));

// Card image area is 300px (250px / 220px on smaller screens) minus its padding.
const CARD_IMAGE_WIDTHS = [220, 300, 440, 600];

/**
 * Same markup the <shopify-list-context> web-component template produced, now rendered on the
 * server from the home route's loader (no client-side Storefront API request).
 */
const ProductCard = ({ product }: { product: ShowcaseProduct }) => {
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image;

  return (
    <div className="product-card">
      <Link
        className="product-card__link"
        to={`/product/${product.handle}`}
        data-product-handle={product.handle}
        prefetch="intent"
      >
        <div className="product-card__image-container">
          {image ? (
            <img
              src={transformShopifyImageUrl(image.url, { width: 600 })}
              srcSet={buildShopifySrcSet(image.url, CARD_IMAGE_WIDTHS)}
              sizes="(max-width: 480px) 220px, (max-width: 768px) 250px, 300px"
              alt={image.altText ?? product.title}
              width={image.width ?? 300}
              height={image.height ?? 280}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="product-card__placeholder" />
          )}
        </div>
        <div className="product-card__info">
          <div className="product-card__details">
            <h3 className="product-card__title">{product.title}</h3>
            <p className="product-card__color">{product.vendor}</p>
            <p className="product-card__price">
              {variant ? formatMoney(variant.price.amount, variant.price.currencyCode) : null}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export const ProductShowcase = ({ products }: { products: ShowcaseProduct[] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Smooth scroll function
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 340; // Card width (300px) + gap (20px) + padding (20px)

    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    // Let CSS handle the smooth animation - don't interrupt it with state updates
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });

    // The scroll event listener will handle button state updates automatically
  };

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const hasScroll = container.scrollWidth > container.clientWidth;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(hasScroll && container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check after a delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateScrollButtons, 500);

    // Passive scroll listeners for better performance
    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
          <br></br>
          <br></br>
          <span className="product-showcase__eyebrow">THE STORE</span>
          <h2 className="product-showcase__title">LATEST DROPS</h2>
          <p className="product-showcase__subtitle">SNEKER. CULTURE. COMMUNITY.</p>
        </div>
      </div>

      {/* Products carousel */}
      <div className="product-showcase__scroll-wrapper">
        {/* Left scroll button */}
        <button
          className={`product-showcase__scroll-btn product-showcase__scroll-btn--left ${
            !canScrollLeft ? 'product-showcase__scroll-btn--disabled' : ''
          }`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          type="button"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>

        {/* Right scroll button */}
        <button
          className={`product-showcase__scroll-btn product-showcase__scroll-btn--right ${
            !canScrollRight ? 'product-showcase__scroll-btn--disabled' : ''
          }`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          type="button"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>

        {/* Scrollable product container */}
        <div
          className="product-showcase__scroll-container"
          ref={scrollContainerRef}
        >
          <div className="product-showcase__scroll-content">
            {/* All products - each links to individual product page */}
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
