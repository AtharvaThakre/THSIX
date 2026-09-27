import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Preloader.css';

export const Preloader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { pathname } = useLocation();

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
              sizes="200px"
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
