import { useEffect, useState } from 'react';
import './Preloader.css';

export const Preloader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show preloader for 1 second static, then 1 second fade
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="preloader" role="status" aria-label="Loading page">
      <div className="preloader__overlay">
        <div className="preloader__logo-container">
          <img
            src="/assets/logo-Photoroom.png"
            alt="THSIX Logo"
            className="preloader__logo"
          />
        </div>
      </div>
    </div>
  );
};
