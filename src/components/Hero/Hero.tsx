import { useEffect, useRef } from 'react';
import gsap from 'gsap';
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
  tags: [" ", " ", " "],
  
  brandMeta: ["", ". ", ", "],
  decoration: ["Good", "Shoes", "Better", "People."]
};

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.fromTo('.hero-image video', 
        { scale: 1.04 },
        { scale: 1, duration: 1.5, ease: 'power3.out' }
      );

      tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.2);
      tl.from('.hero-title-line', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.3);
      tl.from('.hero-description', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.6);
      tl.from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.7);
      tl.from('.hero-tags', { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.8);
      
      tl.from('.hero-meta', { opacity: 0, duration: 1, ease: 'power2.out' }, 0.9);
      tl.from('.hero-decoration', { opacity: 0, duration: 1, ease: 'power2.out' }, 0.9);

    }, heroRef);

    return () => ctx.revert();
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
