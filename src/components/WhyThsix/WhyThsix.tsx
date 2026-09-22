import { useEffect, useRef } from 'react';
import { features } from '../../data/features';
import { WhyThsixFeature } from './WhyThsixFeature';
import './WhyThsix.css';

export const WhyThsix = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let cleanup: (() => void) | undefined;

    const initGsap = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      const triggers: gsap.core.Tween[] = [];

      // Header
      const headerTrigger = gsap.fromTo(
        [headingRef.current, subtitleRef.current],
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true,
          },
        }
      );
      triggers.push(headerTrigger);

      // Feature columns
      const featureCols = gridRef.current?.querySelectorAll('.why-feature');
      if (featureCols && featureCols.length) {
        const featureTrigger = gsap.fromTo(
          featureCols,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 88%',
              once: true,
            },
          }
        );
        triggers.push(featureTrigger);
      }

      return () => {
        triggers.forEach(trigger => {
          trigger?.scrollTrigger?.kill();
          trigger?.kill();
        });
      };
    };

    initGsap().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <section className="why-thsix" ref={sectionRef}>
      <div className="why-thsix__container">
        <div className="why-thsix__header">
          <h2 className="why-thsix__heading" ref={headingRef}>
            WHY THSIX?
          </h2>
          <p className="why-thsix__subtitle" ref={subtitleRef}>
            A BETTER SNEAKER SHOPPING EXPERIENCE.
          </p>
        </div>

        <div className="why-thsix__grid" ref={gridRef}>
          {features.map((feature, index) => (
            <WhyThsixFeature
              key={feature.title}
              feature={feature}
              isLast={index === features.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
