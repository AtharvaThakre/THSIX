import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { lookbookItems } from '../../data/lookbook';
import { LookbookCard } from './LookbookCard';
import './Lookbook.css';

export const Lookbook = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

      // Header elements
      const headerEls = [headingRef.current, subtitleRef.current, linkRef.current].filter(Boolean);
      gsap.fromTo(
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
          },
        }
      );

      // Grid cards
      const cards = gridRef.current?.querySelectorAll('.lookbook-card');
      if (cards && cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    };

    initGsap();
  }, []);

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
          <a href="/lookbook" className="lookbook__view-link" ref={linkRef}>
            <span>VIEW LOOKBOOK</span>
            <ArrowRight size={13} strokeWidth={1.5} className="lookbook-link-arrow" />
          </a>
        </div>

        <div className="lookbook__grid" ref={gridRef}>
          {lookbookItems.map((item) => (
            <LookbookCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
