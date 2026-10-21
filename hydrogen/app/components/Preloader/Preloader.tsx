import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import './Preloader.css';

export const Preloader = () => {
  const { pathname } = useLocation();
  // Start hidden on non-home routes so the server HTML doesn't paint a white overlay
  // that only disappears after hydration. The home route keeps the intro overlay.
  const [isVisible, setIsVisible] = useState(() => pathname === '/');

  useEffect(() => {
    // Only show preloader on home page (/)
    if (pathname !== '/') {
      setIsVisible(false);
      return;
    }

    // Show preloader for 0.5 second static, then 1.7 second fade
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div className="preloader" role="status" aria-label="Loading page">
      <div className="preloader__overlay">
        <div className="preloader__logo-container">
          <picture>
            <source
              srcSet="/assets/logo-Photoroom.webp 280w, /assets/logo-Photoroom@2x.webp 560w"
              sizes="(max-width: 768px) 150px, 200px"
              type="image/webp"
            />
            <img
              src="/assets/logo-Photoroom.png"
              alt="THSIX Logo"
              className="preloader__logo"
              loading="eager"
              decoding="async"
              width="200"
              height="200"
            />
          </picture>
        </div>
      </div>
    </div>
  );
};
