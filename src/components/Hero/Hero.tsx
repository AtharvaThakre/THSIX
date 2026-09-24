import { useEffect, useRef } from 'react';
import { HeroImage } from './HeroImage';
import { HeroContent } from './HeroContent';
import { HeroMeta } from './HeroMeta';
import { HeroDecoration } from './HeroDecoration';
import './Hero.css';

const heroData = {
  eyebrow: " ",
  title: ["THE FIRST", "STEP.", "THE SAMBA."],
  description: "An icon doesn't need an introduction.",
  cta: "SHOP SAMBAS",
  tags: [" "],
  slide: "1st Drop",
  brandMeta: ["", " ", " "],
  decoration: ["Good", "Shoes", "Better", "People."]
};

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let cleanup: (() => void) | undefined;

    // Lazy load GSAP - don't block initial render
    const initAnimations = async () => {
      const { gsap } = await import('gsap');
      
      const ctx = gsap.context(() => {
        // Set initial state - ensure elements start invisible for animation
        gsap.set(['.hero-eyebrow', '.hero-title-line', '.hero-description', '.hero-cta', '.hero-tags', '.hero-meta', '.hero-decoration'], { opacity: 0 });
        
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Only animate video if it exists
        const video = heroRef.current?.querySelector('.hero-image video');
        if (video) {
          gsap.fromTo(video, 
            { scale: 1.04 },
            { scale: 1, duration: 1.5, ease: 'power3.out' }
          );
        }

        // Batch hero animations in single timeline - animate TO full opacity
        tl.to('.hero-eyebrow', { y: 0, opacity: 1, duration: 0.6 }, 0.2)
          .to('.hero-title-line', { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.3)
          .to('.hero-description', { y: 0, opacity: 1, duration: 0.6 }, 0.6)
          .to('.hero-cta', { y: 0, opacity: 1, duration: 0.6 }, 0.7)
          .to('.hero-tags', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.8)
          .to(['.hero-meta', '.hero-decoration'], { opacity: 1, duration: 1, ease: 'power2.out' }, 0.9);

      }, heroRef);

      return () => ctx.revert();
    };

    initAnimations().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <HeroImage />
      <HeroContent data={heroData} />
      <HeroDecoration text={heroData.decoration} />
      <HeroMeta slide={heroData.slide} brandMeta={heroData.brandMeta} />
    </section>
  );
};
