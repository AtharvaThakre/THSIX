import { useEffect, useRef, useState } from 'react';

const VIDEO_DESKTOP_SRC = '/assets/hero-desktop.mp4';
const VIDEO_MOBILE_SRC = '/assets/hero-mobile.mp4';
const MOBILE_QUERY = '(max-width: 767px)';

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

// The poster is always rendered in the SSR HTML and stays mounted underneath the
// video. The video is only fetched when the user and connection allow it.
const canUseVideo = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return false;
  if (/(^|-)[23]g$/.test(connection?.effectiveType ?? '')) return false;
  return true;
};

export const HeroImage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Start the video only after: window load -> browser idle -> hero visible.
  useEffect(() => {
    if (!canUseVideo()) return;
    const container = containerRef.current;
    if (!container) return;

    let isIdle = false;
    let isVisible = !('IntersectionObserver' in window);
    let hasStarted = false;
    let cancelIdle = () => {};

    const start = () => {
      if (hasStarted || !isIdle || !isVisible) return;
      hasStarted = true;
      setVideoSrc(window.matchMedia(MOBILE_QUERY).matches ? VIDEO_MOBILE_SRC : VIDEO_DESKTOP_SRC);
    };

    const scheduleIdle = () => {
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(
          () => {
            isIdle = true;
            start();
          },
          { timeout: 2000 },
        );
        cancelIdle = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(() => {
          isIdle = true;
          start();
        }, 1000);
        cancelIdle = () => clearTimeout(id);
      }
    };

    const onLoad = () => scheduleIdle();
    if (document.readyState === 'complete') {
      scheduleIdle();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        start();
      });
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('load', onLoad);
      cancelIdle();
      observer?.disconnect();
    };
  }, []);

  // Pause the video while the hero is off screen, resume when it returns.
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => {
          // Autoplay can be refused (e.g. low power mode); the poster stays visible.
        });
      } else {
        video.pause();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [videoSrc]);

  return (
    <div className="hero-image" ref={containerRef}>
      {/* Poster: part of the SSR HTML, so the LCP image needs no JS to be discovered. */}
      <picture>
        <source srcSet="/assets/hero-shoes-desktop.avif" type="image/avif" media="(min-width: 768px)" />
        <source srcSet="/assets/hero-shoes-desktop.webp" type="image/webp" media="(min-width: 768px)" />
        <source srcSet="/assets/hero-shoes-mobile.avif" type="image/avif" media="(max-width: 767px)" />
        <source srcSet="/assets/hero-shoes-mobile.webp" type="image/webp" media="(max-width: 767px)" />
        <source srcSet="/assets/hero-shoes-fallback.jpg" type="image/jpeg" />
        <img
          className="hero-poster"
          src="/assets/hero-shoes-fallback.jpg"
          alt="Hero"
          loading="eager"
          fetchPriority="high"
          width={1785}
          height={881}
        />
      </picture>

      {videoSrc && (
        <video
          ref={videoRef}
          className={isVideoReady ? 'is-ready' : undefined}
          src={videoSrc}
          loop
          muted
          autoPlay
          playsInline
          preload="none"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          onCanPlay={() => setIsVideoReady(true)}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
};
