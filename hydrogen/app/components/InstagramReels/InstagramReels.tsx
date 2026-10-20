import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import './InstagramReels.css';

interface ReelData {
  id: string;
  videoUrl: string;
  thumbnail?: string;
  /** Optimized WebP poster 1x */
  posterWebp?: string;
  /** Optimized WebP poster 2x */
  posterWebp2x?: string;
  instagramUrl?: string; // Optional Instagram URL for reference
}

const reelsData: ReelData[] = [
  {
    id: 'reel-1',
    videoUrl: '/assets/reels/igexport-Ddbk0pvtkZL.mp4',
    thumbnail: '/assets/reels/reel_1_cover.png',
    posterWebp: '/assets/reels/reel_1_cover.webp',
    posterWebp2x: '/assets/reels/reel_1_cover@2x.webp',
    instagramUrl: 'https://www.instagram.com/thsix.official/'
  },
  {
    id: 'reel-2', 
    videoUrl: '/assets/reels/igexport-DdeO8usNeZP.mp4',
    thumbnail: '/assets/reels/reel_2_cover.png',
    posterWebp: '/assets/reels/reel_2_cover.webp',
    posterWebp2x: '/assets/reels/reel_2_cover@2x.webp',
    instagramUrl: 'https://www.instagram.com/thsix.official/'
  },
  {
    id: 'reel-3',
    videoUrl: '/assets/reels/igexport-DdWc5pAt43Y.mp4',
    thumbnail: '/assets/reels/reel_3_cover.png',
    posterWebp: '/assets/reels/reel_3_cover.webp',
    posterWebp2x: '/assets/reels/reel_3_cover@2x.webp',
    instagramUrl: 'https://www.instagram.com/thsix.official/'
  }
];

export const InstagramReels = () => {
  // Current carousel positions: [leftIndex, centerIndex, rightIndex]
  const [carouselState, setCarouselState] = useState([0, 1, 2]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start with muted
  const [isVisible, setIsVisible] = useState(false);
  
  // Refs for video elements
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const sectionRef = useRef<HTMLElement>(null);

  // Only start loading videos when the section enters the viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading slightly before visible
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Control video playback based on position
  useEffect(() => {
    if (!isVisible) return;

    const centerReelId = reelsData[carouselState[1]]?.id;
    
    // Pause all videos
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video) {
        if (!video.paused) {
          video.pause();
        }
        // Reset non-center videos (but don't call .load() — that's expensive)
        if (id !== centerReelId) {
          video.currentTime = 0;
        }
      }
    });

    // Play only the center video with optimization
    if (centerReelId && videoRefs.current[centerReelId]) {
      const centerVideo = videoRefs.current[centerReelId];
      if (centerVideo) {
        centerVideo.muted = isMuted;
        centerVideo.currentTime = 0;
        // eager play for UX, but catch to handle autoplay policy
        centerVideo.play().catch(() => {
          // Silently handle autoplay block; user can tap to play
        });
      }
    }
  }, [carouselState, isMuted, isVisible]);

  // Rotate carousel right: [1,2,3] → [2,3,1]
  const rotateRight = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCarouselState(prev => {
      const [left, center, right] = prev;
      return [center, right, left];
    });
    
    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Rotate carousel left: [1,2,3] → [3,1,2]  
  const rotateLeft = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCarouselState(prev => {
      const [left, center, right] = prev;
      return [right, left, center];
    });
    
    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Register video ref
  const setVideoRef = (reelId: string) => (element: HTMLVideoElement | null) => {
    videoRefs.current[reelId] = element;
  };

  // Get position class for styling
  const getPositionClass = (reelIndex: number) => {
    const position = carouselState.indexOf(reelIndex);
    switch (position) {
      case 0: return 'reel-card--left';
      case 1: return 'reel-card--center';
      case 2: return 'reel-card--right';
      default: return 'reel-card--hidden';
    }
  };

  // Check if video is in center position (should play)
  const isCenter = (reelIndex: number) => carouselState[1] === reelIndex;

  return (
    <section className="instagram-reels" ref={sectionRef}>
      <div className="instagram-reels__container">
        
        {/* Header with title and Instagram button */}
        <div className="instagram-reels__header">
          <div className="instagram-reels__title-group">
            <h2 className="instagram-reels__title">THE FEED.</h2>
            <p className="instagram-reels__subtitle">The aesthetic in motion.</p>
          </div>
          <a 
            href="https://www.instagram.com/thsix.official/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="instagram-reels__insta-btn"
            aria-label="Visit THSIX on Instagram"
          >
            <svg className="instagram-reels__insta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
            </svg>
          </a>
        </div>

        <div className="instagram-reels__carousel-wrapper">
          
          {/* Left Arrow */}
          <button 
            className="instagram-reels__nav-btn instagram-reels__nav-btn--left"
            onClick={rotateLeft}
            disabled={isTransitioning}
            aria-label="Previous reel"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Carousel Container */}
          <div className="instagram-reels__carousel">
            {reelsData.map((reel, index) => {
              const isCenterCard = isCenter(index);
              return (
                <div
                  key={reel.id}
                  className={`instagram-reels__card ${getPositionClass(index)} ${isTransitioning ? 'transitioning' : ''}`}
                >
                  <div className="reel-card__video-container">
                    {/* Show cover overlay for non-center videos with blur effect */}
                    {!isCenterCard && (
                      <div 
                        className="reel-card__cover-overlay"
                        style={{ backgroundImage: `url(${reel.posterWebp || reel.thumbnail})` }}
                      />
                    )}
                    
                    {/* Mute button - only show for center card */}
                    {isCenterCard && (
                      <button
                        className="reel-card__mute-btn"
                        onClick={() => setIsMuted(!isMuted)}
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX size={20} />
                        ) : (
                          <Volume2 size={20} />
                        )}
                      </button>
                    )}
                    
                    {/* Only render video elements when section is visible */}
                    {isVisible ? (
                      <video
                        ref={setVideoRef(reel.id)}
                        className="reel-card__video"
                        src={reel.videoUrl}
                        poster={reel.posterWebp || reel.thumbnail}
                        playsInline
                        loop
                        muted
                        preload="none"
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      /* Static poster image before videos are loaded */
                      <picture>
                        {reel.posterWebp && (
                          <source
                            srcSet={`${reel.posterWebp} 400w${reel.posterWebp2x ? `, ${reel.posterWebp2x} 800w` : ''}`}
                            sizes="390px"
                            type="image/webp"
                          />
                        )}
                        <img
                          className="reel-card__video"
                          src={reel.thumbnail}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </picture>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button 
            className="instagram-reels__nav-btn instagram-reels__nav-btn--right"
            onClick={rotateRight}
            disabled={isTransitioning}
            aria-label="Next reel"
          >
            <ChevronRight size={24} />
          </button>

        </div>
      </div>
    </section>
  );
};