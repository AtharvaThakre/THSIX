import { ArrowRight } from 'lucide-react';
import { philosophyData } from '../../data/philosophy';
import './Philosophy.css';

export const Philosophy = () => {
  return (
    <section className="philosophy">
      <div className="philosophy__image-panel">
        {philosophyData.image ? (
          <img 
            src={philosophyData.image} 
            alt="THSIX Philosophy Lifestyle" 
            className="philosophy__image" 
            loading="lazy" 
          />
        ) : (
          <div className="philosophy__image-placeholder" />
        )}
        
        <div className="philosophy__image-overlay">
          {philosophyData.imageOverlay.map((text, i) => (
            <div key={i}>{text}</div>
          ))}
        </div>
      </div>

      <div className="philosophy__text-panel">
        <div className="philosophy__content">
          <span className="philosophy__eyebrow">{philosophyData.eyebrow}</span>
          
          <h2 className="philosophy__title">
            {philosophyData.title.map((line, i) => (
              <div key={i} className="philosophy__title-line">{line}</div>
            ))}
          </h2>

          <p className="philosophy__description">{philosophyData.description}</p>

          <a href={philosophyData.ctaHref} className="philosophy__cta">
            <span>{philosophyData.cta}</span>
            <ArrowRight size={16} strokeWidth={1.5} className="philosophy-cta-arrow" />
          </a>
        </div>

        <div className="philosophy__corner-text">
          {philosophyData.cornerText.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
};
