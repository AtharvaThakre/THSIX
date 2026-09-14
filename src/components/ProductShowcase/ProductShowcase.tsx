import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CartEnhancer } from '../CartEnhancer/CartEnhancer';
import ScrollVelocity from '../ScrollVelocity/ScrollVelocity';
import './ProductShowcase.css';

export const ProductShowcase = () => {
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

    // Listen to scroll events - these fire continuously during smooth scroll
    const handleScroll = () => updateScrollButtons();
    const handleResize = () => updateScrollButtons();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="product-showcase">
      <CartEnhancer />
      {/* Shopify store config */}
      <shopify-store
        store-domain={import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "https://19sjnp-gx.myshopify.com"}
        public-access-token={import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "be59fa0cf086500d7b6456e64f233866"}
        country="US"
        language="EN"
      />

      {/* Global cart (home page) */}
      <shopify-cart id="home-cart" />

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
          <p className="product-showcase__subtitle">CURATED. MINIMAL. YOURS.</p>
        </div>

        <Link to="/shop" className="product-showcase__view-all">
          <span>VIEW ALL</span>
          <ArrowRight size={14} strokeWidth={1.5} className="view-all-arrow" />
        </Link>
      </div>

      {/* Horizontal scroll container with navigation */}
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
            <shopify-list-context
              id="latest-product-list"
              type="product"
              query="products"
              first={250}
            >
              <template
                dangerouslySetInnerHTML={{
                  __html: `
                  <div class="product-card">
                    <a 
                      class="product-card__link"
                      href="/product/"
                      onclick="
                        const handle = this.closest('[data-product-handle]')?.getAttribute('data-product-handle') || 
                                     this.querySelector('[data-product-handle]')?.getAttribute('data-product-handle') ||
                                     'default-product';
                        this.href = '/product/' + handle;
                        return true;
                      "
                      data-product-handle
                      shopify-attr--data-product-handle="product.handle"
                    >
                      <div class="product-card__image-container">
                        <shopify-media
                          query="product.selectedOrFirstAvailableVariant.image"
                          layout="fullWidth"
                          width="320"
                          height="320"
                        ></shopify-media>
                      </div>
                      <div class="product-card__info">
                        <div class="product-card__details">
                          <h3 class="product-card__title">
                            <shopify-data query="product.title"></shopify-data>
                          </h3>
                          <p class="product-card__color">
                            <shopify-data query="product.vendor"></shopify-data>
                          </p>
                          <p class="product-card__price">
                            <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                          </p>
                        </div>
                        <button
                          class="product-card__action"
                          aria-label="Quick add to cart"
                          onclick="
                            event.preventDefault();
                            event.stopPropagation();
                            document.getElementById('global-cart').addLine(event);
                          "
                          shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        </button>
                      </div>
                    </a>
                  </div>
                `,
                }}
              />
            </shopify-list-context>
          </div>
        </div>
      </div>
    </section>
  );
};
