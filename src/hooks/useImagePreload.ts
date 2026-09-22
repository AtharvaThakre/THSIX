import { useEffect, useState } from 'react';

export function useImagePreload(src: string): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoaded(true);
      return;
    }

    const img = new Image();
    
    const handleLoad = () => setLoaded(true);
    const handleError = () => setLoaded(true); // Still set to true to prevent infinite loading

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = src;

    // Check if already loaded (cached)
    if (img.complete) {
      setLoaded(true);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  return loaded;
}
