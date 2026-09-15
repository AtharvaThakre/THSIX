import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { ShopifyProvider } from './contexts/ShopifyContext';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Preloader } from './components/Preloader/Preloader';
import { AnnouncementBar } from './components/Header/AnnouncementBar';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { BlankSection } from './components/BlankSection/BlankSection';
import { ProductShowcase } from './components/ProductShowcase/ProductShowcase';
import { Philosophy } from './components/Philosophy/Philosophy';
import { BrandsShowcase } from './components/BrandsShowcase/BrandsShowcase';
import { NextDrop } from './components/NextDrop/NextDrop';
import { Lookbook } from './components/Lookbook/Lookbook';
import { WhyThsix } from './components/WhyThsix/WhyThsix';
import { Newsletter } from './components/Newsletter/Newsletter';
import { AboutStrip } from './components/AboutStrip/AboutStrip';
import { Footer } from './components/Footer/Footer';
import { ProductDetailPage } from './pages/ProductDetailPage';

function HomePage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', () => {
      if ((gsap as any).globalTimeline) {
        gsap.ticker.tick();
      }
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
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
        <NextDrop />
        <Lookbook />
        <WhyThsix />
        <Newsletter />
      </main>
      <AboutStrip />
      <Footer />
    </>
  );
}

import { CartManager } from './components/Cart/CartManager';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:handle" element={<ProductDetailPage />} />
        </Routes>
      </ShopifyProvider>
    </CartProvider>
  );
}

export default App;
