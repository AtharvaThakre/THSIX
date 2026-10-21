import { useEffect, useRef } from 'react';
import { features } from '../../data/features';
import { syncScrollTrigger } from '../../hooks/smoothScroll';
import { WhyThsixFeature } from './WhyThsixFeature';
import './WhyThsix.css';

export const WhyThsix = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const section = sectionRef.current;
    if (!section) return;

    let disposed = false;
    let ctx: { revert: () => void } | undefined;
    let unsyncScroll: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      unsyncScroll = syncScrollTrigger(ScrollTrigger);

      ctx = gsap.context(() => {
        // Header
        gsap.fromTo(
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

        // Feature columns
        const grid = gridRef.current;
        const featureCols = grid?.querySelectorAll('.why-feature');
        if (grid && featureCols && featureCols.length) {
          gsap.fromTo(
            featureCols,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: grid,
                start: 'top 88%',
                once: true,
              },
            }
          );
        }
      }, section);
    })();

    return () => {
      disposed = true;
      ctx?.revert();
      unsyncScroll?.();
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
