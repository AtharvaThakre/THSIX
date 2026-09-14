import { useEffect, useRef } from 'react';
import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';

export const ReviewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const initGsap = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const header = headerRef.current;
      if (!header) return;

      gsap.fromTo(
        header.children,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          },
        }
      );
    };

    initGsap();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="w-full bg-[#f5f5f3] py-16 md:py-24 border-t border-[#d9d9d5] overflow-hidden"
      aria-label="Customer shoe reviews and testimonials"
    >
      <div className="w-[min(100%-clamp(48px,10vw,160px),1600px)] mx-auto mb-10 text-center" ref={headerRef}>
        <span className="inline-block text-[11px] font-bold tracking-[0.22em] text-[#777777] uppercase mb-3">
          [ VERIFIED COMMUNITY REVIEWS ]
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111111] uppercase mb-3">
          STREET VERIFIED
        </h2>
        <p className="text-sm sm:text-base text-[#777777] max-w-xl mx-auto tracking-wide">
          Real feedback from sneakerheads, stylists, and collectors wearing THSIX on the pavement.
        </p>
      </div>

      <StaggerTestimonials />
    </section>
  );
};

export default ReviewsSection;
