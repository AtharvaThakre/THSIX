import { ArrowRight } from 'lucide-react';
import { philosophyData } from '../../data/philosophy';
import './Philosophy.css';

export const Philosophy = () => {
  return (
    <section className="philosophy">
      {/* Full-bleed background image */}
      {philosophyData.image ? (
        <img
          src={philosophyData.image}
          alt="THSIX Philosophy"
          className="philosophy__image"
          loading="lazy"
        />
      ) : (
        <div className="philosophy__image-placeholder" />
      )}

      {/* Corner tag */}
      <div className="philosophy__corner-text">
        {philosophyData.cornerText.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* Bottom-anchored content */}
      <div className="philosophy__content">
        <span className="philosophy__eyebrow">{philosophyData.eyebrow}</span>

        <h2 className="philosophy__title">
          {philosophyData.title.map((line, i) => (
            <span key={i} className="philosophy__title-line">{line}</span>
          ))}
        </h2>

        <p className="philosophy__description">{philosophyData.description}</p>

        <a href={philosophyData.ctaHref} className="philosophy__cta">
          <span>{philosophyData.cta}</span>
          <ArrowRight size={14} strokeWidth={1.5} className="philosophy-cta-arrow" />
        </a>
      </div>
    </section>
  );
};
