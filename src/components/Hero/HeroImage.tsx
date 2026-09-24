import { useEffect, useRef, useState } from 'react';

export const HeroImage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    // Defer video loading until critical content is painted
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Don't load video for users who prefer reduced motion
      return;
    }

    // Use requestIdleCallback to load video during idle time
    const loadVideo = () => {
      setShouldLoadVideo(true);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadVideo, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadVideo, 1000);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      video.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [shouldLoadVideo]);

  return (
    <div className="hero-image">
      {/* Fallback poster image - shown until video loads */}
      {!isLoaded && (
        <picture>
          <source
            srcSet="/assets/hero-shoes-desktop.webp"
            type="image/webp"
            media="(min-width: 768px)"
          />
          <source
            srcSet="/assets/hero-shoes-mobile.webp"
            type="image/webp"
            media="(max-width: 767px)"
          />
          <source
            srcSet="/assets/hero-shoes-fallback.jpg"
            type="image/jpeg"
          />
          <img
            src="/assets/hero-shoes-fallback.jpg"
            alt="Hero"
            loading="eager"
            fetchPriority="high"
            width="1920"
            height="1080"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </picture>
      )}
      
      {/* Video - loads during idle time */}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          loop
          muted
          autoPlay
          playsInline
          preload="auto"
          poster="/assets/hero-shoes-desktop.webp"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          {/* Primary source: existing herovideo.mp4 */}
          <source src="/assets/herovideo.mp4" type="video/mp4" />
          {/* Optimized WebM fallback (best compression) */}
          <source src="/assets/videos/herovideo.webm" type="video/webm" />
          {/* Desktop MP4 fallback (1920x1080) */}
          <source src="/assets/videos/herovideo-desktop.mp4" type="video/mp4" />
          {/* Mobile MP4 fallback (1280x720, lower bandwidth) */}
          <source src="/assets/videos/herovideo-mobile.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
};

