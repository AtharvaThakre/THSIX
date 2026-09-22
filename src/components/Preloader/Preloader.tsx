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
          <img
            src="/assets/logo-Photoroom.png"
            alt="THSIX Logo"
            className="preloader__logo"
            loading="eager"
            decoding="async"
            width="200"
            height="200"
          />
        </div>
      </div>
    </div>
  );
};
