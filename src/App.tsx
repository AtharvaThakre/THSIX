import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
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

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', () => {
      // Synchronize GSAP ScrollTrigger if active
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

export default App;
