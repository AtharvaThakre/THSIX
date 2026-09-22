import { ImgHTMLAttributes, useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  eager?: boolean;
  aspectRatio?: string;
  className?: string;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  eager = false,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) => {
  const [imageRef, isVisible] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '200px',
    freezeOnceVisible: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldLoad = eager || isVisible;

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    // Only generate srcSet for local assets
    if (!originalSrc.startsWith('/assets/')) return undefined;
    
    const basePath = originalSrc.split('?')[0];
    const ext = basePath.split('.').pop();
    
    // For now, just return the original. In production, you'd have multiple sizes
    return undefined;
  };

  return (
    <div
      ref={imageRef as React.RefObject<HTMLDivElement>}
      className={`optimized-image-wrapper ${className}`}
      style={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: aspectRatio,
        overflow: 'hidden',
      }}
    >
      {shouldLoad && !hasError ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          srcSet={generateSrcSet(src)}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
          {...props}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
          }}
        />
      )}
    </div>
  );
};
