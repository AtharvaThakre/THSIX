import { useEffect, useRef } from 'react';
import { lookbookItems } from '../../data/lookbook';
import AccordionGallery from '../AccordionGallery/AccordionGallery';
import './Lookbook.css';

export const Lookbook = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let gsap: typeof import('gsap').gsap;
    let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;

    const initGsap = async () => {
      const gsapMod = await import('gsap');
      const stMod = await import('gsap/ScrollTrigger');
      gsap = gsapMod.gsap;
      ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      // Header elements - single batch animation
      const headerEls = [headingRef.current, subtitleRef.current].filter(Boolean);
      const headerTrigger = gsap.fromTo(
        headerEls,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true, // Fire once and cleanup
          },
        }
      );

      return () => {
        headerTrigger?.scrollTrigger?.kill();
        headerTrigger?.kill();
      };
    };

    let cleanup: (() => void) | undefined;
    initGsap().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const galleryItems = lookbookItems.map(item => ({
    image: item.image,
    label: item.title,
    alt: item.alt
  }));

  return (
    <section className="lookbook" ref={sectionRef}>
      <div className="lookbook__container">
        <div className="lookbook__header">
          <div className="lookbook__header-left">
            <h2 className="lookbook__heading" ref={headingRef}>
              HOW THSIX IS WORN
            </h2>
            <p className="lookbook__subtitle" ref={subtitleRef}>
              REAL PEOPLE. REAL STYLE.
            </p>
          </div>
        </div>

        <AccordionGallery 
          items={galleryItems} 
          defaultIndex={0} 
          expandRatio={0.52} 
          trigger="hover" 
        />
      </div>
    </section>
  );
};
