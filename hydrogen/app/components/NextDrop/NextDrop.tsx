import { nextDropData } from '../../data/nextDrop';
import './NextDrop.css';

export const NextDrop = () => {
  return (
    <section className="next-drop">
      <div className="next-drop__media">
        <picture>
          {/* Full-bleed background: the image always spans the section's full width. */}
          <source
            srcSet="/assets/group-121.webp 800w, /assets/group-121@2x.webp 1600w"
            type="image/webp"
            sizes="100vw"
          />
          <img
            src="/assets/group-121-fallback.jpg"
            alt="Next Drop Sneaker"
            className="next-drop__image"
            loading="lazy"
            decoding="async"
            width="800"
            height="267"
          />
        </picture>
      </div>

      <div className="next-drop__content">
        <span className="next-drop__eyebrow">{nextDropData.eyebrow}</span>
        <h2 className="next-drop__title">{nextDropData.title}</h2>
        <div className="next-drop__meta">{nextDropData.dropNumber}</div>
        <p className="next-drop__description">{nextDropData.description}</p>
      </div>

      <div className="next-drop__decoration">
        {nextDropData.decoration.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </section>
  );
};
