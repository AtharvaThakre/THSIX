import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Preloader } from './components/Preloader/Preloader';
import { AnnouncementBar } from './components/Header/AnnouncementBar';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { ProductShowcase } from './components/ProductShowcase/ProductShowcase';
import { Philosophy } from './components/Philosophy/Philosophy';
import { BrandsShowcase } from './components/BrandsShowcase/BrandsShowcase';
import { NextDrop } from './components/NextDrop/NextDrop';
import { Lookbook } from './components/Lookbook/Lookbook';
import { WhyThsix } from './components/WhyThsix/WhyThsix';
import { Newsletter } from './components/Newsletter/Newsletter';
import { Footer } from './components/Footer/Footer';
import { ShopPage } from './pages/ShopPage';
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
        <ProductShowcase />
        <Philosophy />
        <BrandsShowcase />
        <NextDrop />
        <Lookbook />
        <WhyThsix />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}

import { FloatingCartButton } from './components/Cart/FloatingCartButton';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      {/* Preloader - shown on initial page load */}
      <Preloader />

      {/* Scroll to top on route changes */}
      <ScrollToTop />

      {/* Global Shopify Store Configuration */}
      <shopify-store
        store-domain="https://19sjnp-gx.myshopify.com"
        public-access-token="be59fa0cf086500d7b6456e64f233866"
        country="US"
        language="EN"
      />

      {/* Floating Bottom-Right Cart Button */}
      <FloatingCartButton />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:handle" element={<ProductDetailPage />} />
      </Routes>
    </>
  );
}

export default App;
