import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ShopifyGuard } from '../ShopifyGuard';
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
    <section className="product-showcase">

      <ShopifyGuard>
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
          <br></br>
          <br></br>   
          <span className="product-showcase__eyebrow">THE STORE</span>
          <h2 className="product-showcase__title">LATEST DROPS</h2>
          <p className="product-showcase__subtitle">CURATED. MINIMAL. YOURS.</p>
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
      </ShopifyGuard>
    </section>
  );
};
