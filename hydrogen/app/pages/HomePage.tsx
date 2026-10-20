import { useEffect, lazy, Suspense } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Hero } from '../components/Hero/Hero';
import { BlankSection } from '../components/BlankSection/BlankSection';
import { ProductShowcase, type ShowcaseProduct } from '../components/ProductShowcase/ProductShowcase';
import { Philosophy } from '../components/Philosophy/Philosophy';
import { BrandsShowcase } from '../components/BrandsShowcase/BrandsShowcase';
import { Footer } from '../components/Footer/Footer';

// Lazy load heavy components below the fold
const NextDrop = lazy(() => import('../components/NextDrop/NextDrop').then(m => ({ default: m.NextDrop })));
const Lookbook = lazy(() => import('../components/Lookbook/Lookbook').then(m => ({ default: m.Lookbook })));
const WhyThsix = lazy(() => import('../components/WhyThsix/WhyThsix').then(m => ({ default: m.WhyThsix })));
const Newsletter = lazy(() => import('../components/Newsletter/Newsletter').then(m => ({ default: m.Newsletter })));
const InstagramReels = lazy(() => import('../components/InstagramReels/InstagramReels').then(m => ({ default: m.InstagramReels })));

// Loading fallback component
const SectionFallback = () => (
  <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

export function HomePage({ products }: { products: ShowcaseProduct[] }) {
  // Links like /#shop from other pages: scroll once the section has rendered
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    const timer = setInterval(() => {
      const element = document.getElementById(id);
      if (element || ++tries > 20) {
        clearInterval(timer);
        element?.scrollIntoView({ block: 'start' });
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Skip smooth scroll if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let lenis: any;
    let rafId: number;
    let cancelled = false;

    // Lazy load Lenis to reduce initial bundle
    const initSmoothScroll = async () => {
      const LenisModule = await import('lenis');
      if (cancelled) return;
      const Lenis = LenisModule.default;

      lenis = new Lenis({
        duration: 0.8,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    };

    void initSmoothScroll();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <BlankSection />
        <ProductShowcase products={products} />
        <Philosophy />
        <BrandsShowcase />
        <Suspense fallback={<SectionFallback />}>
          <NextDrop />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Lookbook />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <WhyThsix />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Newsletter />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <InstagramReels />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
