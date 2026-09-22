import { useRef, useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { brandsData } from '../../data/brands';
import { BrandCard } from './BrandCard';
import './BrandsShowcase.css';

export const BrandsShowcase = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Smooth scroll function
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 340; // Card width + gap
    
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
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

    // Initial check after a delay
    const timeoutId = setTimeout(updateScrollButtons, 500);

    // Passive scroll listener for better performance
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
    <section className="brands-showcase">
      <div className="brands-showcase__header">
        <div className="brands-showcase__header-left">
          <h2 className="brands-showcase__title">MORE BRANDS. A BIGGER TOMORROW.</h2>
          <p className="brands-showcase__subtitle">SAMBA IS JUST THE BEGINNING.</p>
        </div>

        <a href="/brands" className="brands-showcase__explore">
          <span>EXPLORE BRANDS</span>
          <ArrowRight size={14} strokeWidth={1.5} className="explore-arrow" />
        </a>
      </div>

      {/* Horizontal scroll container with navigation */}
      <div className="brands-showcase__scroll-wrapper">
        {/* Left scroll button */}
        <button
          className={`brands-showcase__scroll-btn brands-showcase__scroll-btn--left ${
            !canScrollLeft ? 'brands-showcase__scroll-btn--disabled' : ''
          }`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          type="button"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>

        {/* Right scroll button */}
        <button
          className={`brands-showcase__scroll-btn brands-showcase__scroll-btn--right ${
            !canScrollRight ? 'brands-showcase__scroll-btn--disabled' : ''
          }`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          type="button"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>

        {/* Scrollable brands container */}
        <div 
          className="brands-showcase__scroll-container" 
          ref={scrollContainerRef}
        >
          <div className="brands-showcase__scroll-content">
            {brandsData.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
