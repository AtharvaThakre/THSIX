import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './InstagramReels.css';

interface ReelData {
  id: string;
  videoUrl: string;
  thumbnail?: string;
  instagramUrl?: string; // Optional Instagram URL for reference
}

// Placeholder reel data - easily replaceable with actual Instagram reel URLs
// Note: Instagram reels require using extracted video URLs or embedding
// You can get direct video URLs by using browser developer tools on Instagram
const reelsData: ReelData[] = [
  {
    id: 'reel-1',
    videoUrl: '/Assets/reels/igexport-DdZBkXWtTzo.mp4',
    thumbnail: 'https://via.placeholder.com/300x500?text=THSIX+Reel+1',
    instagramUrl: 'https://www.instagram.com/reel/DdZBkXWtTzo/'
  },
  {
    id: 'reel-2', 
    videoUrl: '/Assets/reels/igexport-DdWc5pAt43Y.mp4',
    thumbnail: 'https://via.placeholder.com/300x500?text=THSIX+Reel+2',
    instagramUrl: 'https://www.instagram.com/reel/DdWc5pAt43Y/'
  },
  {
    id: 'reel-3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
  }
];

export const InstagramReels = () => {
  // Current carousel positions: [leftIndex, centerIndex, rightIndex]
  const [carouselState, setCarouselState] = useState([0, 1, 2]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs for video elements
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Get current center reel index
  const _centerIndex = carouselState[1];

  // Control video playback based on position
  useEffect(() => {
    const centerReelId = reelsData[carouselState[1]]?.id;
    
    // Pause all videos first
    Object.values(videoRefs.current).forEach(video => {
      if (video && !video.paused) {
        video.pause();
        video.currentTime = 0; // Reset to beginning
      }
    });

    // Play only the center video
    if (centerReelId && videoRefs.current[centerReelId]) {
      const centerVideo = videoRefs.current[centerReelId];
      if (centerVideo) {
        centerVideo.currentTime = 0;
        centerVideo.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      }
    }
  }, [carouselState]);

  // Rotate carousel right: [1,2,3] → [2,3,1]
  const rotateRight = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCarouselState(prev => {
      const [left, center, right] = prev;
      // Reel 1 moves LEFT → RIGHT, Reel 3 moves RIGHT → CENTER, Reel 2 moves CENTER → LEFT
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
      // Reel 1 moves CENTER → RIGHT, Reel 2 moves RIGHT → LEFT, Reel 3 moves LEFT → CENTER
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

  return (
    <section className="instagram-reels">
      <div className="instagram-reels__container">
        
        {/* Header with title and Instagram button */}
        <div className="instagram-reels__header">
          <h2 className="instagram-reels__title">Reels</h2>
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
            {reelsData.map((reel, index) => (
              <div
                key={reel.id}
                className={`instagram-reels__card ${getPositionClass(index)} ${isTransitioning ? 'transitioning' : ''}`}
              >
                <div className="reel-card__video-container">
                  <video
                    ref={setVideoRef(reel.id)}
                    className="reel-card__video"
                    src={reel.videoUrl}
                    poster={reel.thumbnail}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ))}
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