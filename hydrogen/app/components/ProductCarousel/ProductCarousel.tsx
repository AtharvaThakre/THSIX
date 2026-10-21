import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard';
import './ProductCarousel.css';

// Must match the card widths set in ProductCarousel.css (300px / 250px at <=768px / 220px at <=480px)
const CARD_SIZES = '(max-width: 480px) 220px, (max-width: 768px) 250px, 300px';

interface ProductCarouselProps {
  /** Accessible name for the row (also used in the arrow button labels). */
  label: string;
  products: ProductCardData[];
}

/**
 * Horizontally scrolling row of product cards. Swipes natively with scroll snapping; on devices
 * with a hover-capable pointer, arrow buttons scroll by whole cards. Each instance is independent.
 * Cards are server-rendered, so the row is fully usable (native scroll) before hydration.
 */
export function ProductCarousel({ label, products }: ProductCarouselProps) {
  const trackId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [{ canScrollLeft, canScrollRight }, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const nextLeft = container.scrollLeft > 1;
    const nextRight = maxScroll > 1 && container.scrollLeft < maxScroll - 1;
    setScrollState((prev) =>
      prev.canScrollLeft === nextLeft && prev.canScrollRight === nextRight
        ? prev
        : { canScrollLeft: nextLeft, canScrollRight: nextRight },
    );
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateScrollState();
      });
    };

    updateScrollState();
    container.addEventListener('scroll', schedule, { passive: true });

    // Viewport changes resize the container; image/card changes resize the track
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    if (container.firstElementChild) observer.observe(container.firstElementChild);

    return () => {
      container.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [updateScrollState, products.length]);

  const scrollByPage = (direction: -1 | 1) => {
    const container = scrollRef.current;
    const track = container?.firstElementChild;
    if (!container || !track) return;

    // One page = as many whole cards (card width + gap) as fit in view, at least one card
    const cards = track.children;
    const stride =
      cards.length > 1
        ? (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft
        : ((cards[0] as HTMLElement | undefined)?.offsetWidth ?? container.clientWidth);
    const pageWidth = Math.max(1, Math.floor(container.clientWidth / stride)) * stride;

    // Animation (or none, for reduced motion) comes from `scroll-behavior` in the CSS
    container.scrollBy({ left: direction * pageWidth });
  };

  return (
    <div className="product-carousel">
      <button
        className="product-carousel__btn product-carousel__btn--left"
        onClick={() => scrollByPage(-1)}
        aria-label={`Scroll ${label} left`}
        aria-controls={trackId}
        disabled={!canScrollLeft}
        type="button"
      >
        <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <button
        className="product-carousel__btn product-carousel__btn--right"
        onClick={() => scrollByPage(1)}
        aria-label={`Scroll ${label} right`}
        aria-controls={trackId}
        disabled={!canScrollRight}
        type="button"
      >
        <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <div className="product-carousel__scroll" id={trackId} ref={scrollRef} role="region" aria-label={label}>
        <div className="product-carousel__track">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} sizes={CARD_SIZES} loading="lazy" />
          ))}
        </div>
      </div>
    </div>
  );
}
