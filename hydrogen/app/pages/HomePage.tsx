import { useEffect, lazy } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Hero } from '../components/Hero/Hero';
import { BlankSection } from '../components/BlankSection/BlankSection';
import { ProductShowcase, type ShowcaseCollection, type ShowcaseProduct } from '../components/ProductShowcase/ProductShowcase';
import { Philosophy } from '../components/Philosophy/Philosophy';
import { BrandsShowcase } from '../components/BrandsShowcase/BrandsShowcase';
import { Footer } from '../components/Footer/Footer';
import { LazySection } from '../components/LazySection/LazySection';
import { setSmoothScroll } from '../hooks/smoothScroll';
// The deferred sections are server-rendered, so their styles must ship with the page (a lazy
// chunk's CSS only arrives with its JS, which would leave that markup unstyled until then)
import '../components/NextDrop/NextDrop.css';
import '../components/AccordionGallery/AccordionGallery.css';
import '../components/Lookbook/Lookbook.css';
import '../components/WhyThsix/WhyThsix.css';
import '../components/Newsletter/Newsletter.css';
import '../components/InstagramReels/InstagramReels.css';

// Below-the-fold sections. Their markup is server-rendered; their JavaScript
// (and the GSAP / icon code they use) only loads when a section nears the viewport.
const NextDrop = lazy(() => import('../components/NextDrop/NextDrop').then(m => ({ default: m.NextDrop })));
const Lookbook = lazy(() => import('../components/Lookbook/Lookbook').then(m => ({ default: m.Lookbook })));
const WhyThsix = lazy(() => import('../components/WhyThsix/WhyThsix').then(m => ({ default: m.WhyThsix })));
const Newsletter = lazy(() => import('../components/Newsletter/Newsletter').then(m => ({ default: m.Newsletter })));
const InstagramReels = lazy(() => import('../components/InstagramReels/InstagramReels').then(m => ({ default: m.InstagramReels })));

/**
 * Smooth wheel scrolling for desktop mouse users only. Lenis is loaded after
 * the page has loaded and gone idle, and its frame loop only runs while a
 * smooth scroll is in progress (Lenis's autoRaf would keep a loop alive forever).
 * Returns a cleanup function.
 */
function startSmoothScroll(): () => void {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return () => {};

  let disposed = false;
  let lenis: { raf: (time: number) => void; time: number; isScrolling: unknown; destroy: () => void } | null = null;
  let frameId = 0;
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const runFrame = (time: number) => {
    frameId = 0;
    if (!lenis) return;
    lenis.raf(time);
    if (lenis.isScrolling === 'smooth') frameId = requestAnimationFrame(runFrame);
  };

  // Wheel input starts a frame loop; it stops by itself once the smooth scroll settles.
  const wake = () => {
    if (!lenis || frameId) return;
    // Lenis derives its animation step from the time of its last frame; reset it so an idle gap doesn't jump.
    lenis.time = performance.now();
    frameId = requestAnimationFrame(runFrame);
  };

  const start = async () => {
    const { default: Lenis } = await import('lenis');
    if (disposed) return;

    const instance = new Lenis({
      duration: 0.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis = instance;
    setSmoothScroll(instance);
    window.addEventListener('wheel', wake, { passive: true, capture: true });
  };

  const schedule = () => {
    const hasIdleCallback = typeof window.requestIdleCallback === 'function';
    if (hasIdleCallback) {
      idleId = window.requestIdleCallback(() => void start(), { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(() => void start(), 200);
    }
  };

  const onLoad = () => schedule();
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', onLoad, { once: true });
  }

  return () => {
    disposed = true;
    window.removeEventListener('load', onLoad);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    window.removeEventListener('wheel', wake, { capture: true });
    cancelAnimationFrame(frameId);
    if (lenis) {
      setSmoothScroll(null);
      lenis.destroy();
    }
  };
}

export function HomePage({
  products,
  collections,
  error,
}: {
  products: ShowcaseProduct[];
  collections: ShowcaseCollection[];
  error?: boolean;
}) {
  // Links like /#shop from other pages: scroll once the section has rendered
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const element = document.getElementById(id);
      if (element || ++tries > 20) {
        window.clearInterval(timer);
        element?.scrollIntoView({ block: 'start' });
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => startSmoothScroll(), []);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <BlankSection />
        <ProductShowcase products={products} collections={collections} error={error} />
        <Philosophy />
        <BrandsShowcase />
        <LazySection>
          <NextDrop />
        </LazySection>
        <LazySection>
          <Lookbook />
        </LazySection>
        <LazySection>
          <WhyThsix />
        </LazySection>
        <LazySection>
          <Newsletter />
        </LazySection>
        <LazySection>
          <InstagramReels />
        </LazySection>
      </main>

      <Footer />
    </>
  );
}
