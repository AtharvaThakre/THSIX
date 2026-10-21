import { useEffect, useRef } from 'react';
import { lookbookItems, type LookbookItem } from '../../data/lookbook';
import AccordionGallery, { type GalleryItem, type GallerySource } from '../AccordionGallery/AccordionGallery';
import { syncScrollTrigger } from '../../hooks/smoothScroll';
import './Lookbook.css';

const DESKTOP_SIZES = '(min-width: 1024px) 800px, 60vw';
const MOBILE_SIZES = '90vw';

function srcSet(item: LookbookItem, variant: 'desk' | 'mobile', widths: number[], ext: 'webp' | 'avif') {
  return widths
    .map((width, i) => `/assets/lookbook/${item.slug}-${variant}${i ? '@2x' : ''}.${ext} ${width}w`)
    .join(', ');
}

// Built once: AVIF first, then WebP; the 3:4 mobile crop is used at 640px and below.
const galleryItems: GalleryItem[] = lookbookItems.map((item) => {
  const sources: GallerySource[] = [
    { type: 'image/avif', media: '(max-width: 640px)', srcSet: srcSet(item, 'mobile', item.mobileWidths, 'avif'), sizes: MOBILE_SIZES },
    { type: 'image/avif', srcSet: srcSet(item, 'desk', item.desktopWidths, 'avif'), sizes: DESKTOP_SIZES },
    { type: 'image/webp', media: '(max-width: 640px)', srcSet: srcSet(item, 'mobile', item.mobileWidths, 'webp'), sizes: MOBILE_SIZES },
    { type: 'image/webp', srcSet: srcSet(item, 'desk', item.desktopWidths, 'webp'), sizes: DESKTOP_SIZES },
  ];
  const deskWidth = item.desktopWidths[0];
  return {
    image: `/assets/lookbook/${item.slug}-desk.jpg`,
    fallback: `/assets/lookbook/${item.slug}-desk.jpg`,
    label: item.title,
    alt: item.alt,
    sources,
    // 7:4 crop, so height = width * 4 / 7
    width: deskWidth,
    height: Math.round((deskWidth * 4) / 7),
  };
});

export const Lookbook = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

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
        gsap.fromTo(
          [headingRef.current, subtitleRef.current].filter(Boolean),
          { opacity: 0, y: 28 },
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
      }, section);
    })();

    return () => {
      disposed = true;
      ctx?.revert();
      unsyncScroll?.();
    };
  }, []);

  return (
    <section className="lookbook" ref={sectionRef}>
      <div className="lookbook__container">
        <div className="lookbook__header">
          <div className="lookbook__header-left">
            <h2 className="lookbook__heading" ref={headingRef}>
              The Styling Guide
            </h2>
            <p className="lookbook__subtitle" ref={subtitleRef}>
              Wear it your way
            </p>
          </div>
        </div>

        <AccordionGallery
          items={galleryItems}
          defaultIndex={0}
          expandRatio={0.52}
          trigger="hover"
        />
      </div>
    </section>
  );
};
