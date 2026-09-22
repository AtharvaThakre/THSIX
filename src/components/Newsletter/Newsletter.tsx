import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { newsletterContent } from '../../data/newsletter';
import './Newsletter.css';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');

  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setFormState('submitting');
    // Simulate async — wire up to email provider later
    setTimeout(() => {
      setFormState('success');
    }, 800);
  };

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

      const animTrigger = gsap.fromTo(
        [contentRef.current, decorRef.current],
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          },
        }
      );

      return () => {
        animTrigger?.scrollTrigger?.kill();
        animTrigger?.kill();
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
    <section className="newsletter" ref={sectionRef} aria-label="Newsletter signup">
      {/* Background image */}
      <img
        src={newsletterContent.image}
        alt=""
        className="newsletter__bg-image"
        loading="lazy"
        aria-hidden="true"
      />
      {/* Dark overlay */}
      <div className="newsletter__overlay" aria-hidden="true" />

      {/* Content */}
      <div className="newsletter__inner">
        <div className="newsletter__content" ref={contentRef}>
          <h2 className="newsletter__heading">{newsletterContent.title}</h2>
          <p className="newsletter__desc">{newsletterContent.description}</p>

          {formState === 'success' ? (
            <p className="newsletter__success">You&apos;re on the list.</p>
          ) : (
            <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
              <div className="newsletter__field-group">
                <label htmlFor="newsletter-email" className="visually-hidden">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  className="newsletter__input"
                  placeholder={newsletterContent.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formState === 'submitting'}
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="newsletter__submit"
                  aria-label="Subscribe"
                  disabled={formState === 'submitting'}
                >
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="newsletter__decoration" ref={decorRef} aria-hidden="true">
          {newsletterContent.decoration.map((line, i) => (
            <div key={i} className="newsletter__deco-line">
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
