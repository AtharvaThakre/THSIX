import { useEffect, useRef, useState } from 'react';

export const HeroImage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div className="hero-image">
      <video
        ref={videoRef}
        src="/assets/herovideo.mp4"
        poster="/assets/hero-shoes.jpg"
        loop
        muted
        playsInline
        preload="metadata"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      {!isLoaded && (
        <img
          src="/assets/hero-shoes.jpg"
          alt="Hero"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  );
};

