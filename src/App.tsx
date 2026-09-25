import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { ShopifyProvider } from './contexts/ShopifyContext';
import { Preloader } from './components/Preloader/Preloader';
import { AnnouncementBar } from './components/Header/AnnouncementBar';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { BlankSection } from './components/BlankSection/BlankSection';
import { ProductShowcase } from './components/ProductShowcase/ProductShowcase';
import { Philosophy } from './components/Philosophy/Philosophy';
import { BrandsShowcase } from './components/BrandsShowcase/BrandsShowcase';
import { Footer } from './components/Footer/Footer';
import { CartManager } from './components/Cart/CartManager';
import { CheckoutNotice } from './components/Cart/CheckoutNotice';

// Lazy load heavy components below the fold
const NextDrop = lazy(() => import('./components/NextDrop/NextDrop').then(m => ({ default: m.NextDrop })));
const Lookbook = lazy(() => import('./components/Lookbook/Lookbook').then(m => ({ default: m.Lookbook })));
const WhyThsix = lazy(() => import('./components/WhyThsix/WhyThsix').then(m => ({ default: m.WhyThsix })));
const Newsletter = lazy(() => import('./components/Newsletter/Newsletter').then(m => ({ default: m.Newsletter })));
const InstagramReels = lazy(() => import('./components/InstagramReels/InstagramReels').then(m => ({ default: m.InstagramReels })));

// Lazy load page components
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess').then(m => ({ default: m.CheckoutSuccess })));
const BrandCollectionPage = lazy(() => import('./pages/BrandCollectionPage').then(m => ({ default: m.BrandCollectionPage })));

// Loading fallback component
const SectionFallback = () => (
  <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

function HomePage() {
  useEffect(() => {
    // Skip smooth scroll if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let lenis: any;
    let rafId: number;

    // Lazy load Lenis to reduce initial bundle
    const initSmoothScroll = async () => {
      const LenisModule = await import('lenis');
      const Lenis = LenisModule.default;

      lenis = new Lenis({
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

    initSmoothScroll();

    return () => {
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
        <ProductShowcase />
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

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Page loading fallback
const PageFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '60px', height: '60px', border: '4px solid #f3f3f3', borderTop: '4px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

function App() {
  const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "https://19sjnp-gx.myshopify.com";
  const accessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "be59fa0cf086500d7b6456e64f233866";

  return (
    <CartProvider>
      <ShopifyProvider storeDomain={storeDomain} accessToken={accessToken}>
        {/* Preloader - shown on initial page load */}
        <Preloader />

        {/* Scroll to top on route changes */}
        <ScrollToTop />

        {/* Global Shopify Store Configuration - ONLY ONE INSTANCE */}
        <shopify-store
          store-domain={storeDomain}
          public-access-token={accessToken}
          country="US"
          language="EN"
          cache-policy="cache-first-network-fallback"
        />

        {/* Cart System */}
        <CartManager />
        <CheckoutNotice />

        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:handle" element={<ProductDetailPage />} />
            <Route path="/brands/:brandId" element={<BrandCollectionPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            {/* Shopify's primary domain is thsix.com, so its order-status and cart-permalink
                links (used by Shiprocket after payment / as a fallback) land on this app */}
            <Route path="/:shopId/orders/:token" element={<CheckoutSuccess />} />
            <Route path="/checkouts/*" element={<CheckoutSuccess />} />
            <Route path="/cart/*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ShopifyProvider>
    </CartProvider>
  );
}

export default App;
