import { philosophyData } from '../../data/philosophy';
import './Philosophy.css';

export const Philosophy = () => {
  const imageSrc = philosophyData.image;
  const isDefaultLifestyle = imageSrc?.includes('philosophy-lifestyle');
  const versionParam = imageSrc?.includes('?') ? imageSrc.substring(imageSrc.indexOf('?')) : '';

  return (
    <section className="philosophy" id="about">
      {/* Full-bleed background image */}
      {imageSrc ? (
        <picture>
          {isDefaultLifestyle && (
            <source
              srcSet={`/assets/philosophy-lifestyle.webp${versionParam} 800w, /assets/philosophy-lifestyle@2x.webp${versionParam} 1600w`}
              type="image/webp"
              sizes="100vw"
            />
          )}
          <source
            srcSet={`${imageSrc} 800w`}
            type="image/jpeg"
            sizes="100vw"
          />
          <img
            src={imageSrc}
            alt="THSIX Philosophy"
            className="philosophy__image"
            loading="lazy"
            decoding="async"
            width="1920"
            height="1080"
          />
        </picture>
      ) : (
        <div className="philosophy__image-placeholder" />
      )}

      {/* Corner tag */}
      {philosophyData.cornerText && philosophyData.cornerText.length > 0 && (
        <div className="philosophy__corner-text">
          {philosophyData.cornerText.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Bottom-anchored content */}
      <section className="philosophy__content">
        <span className="philosophy__eyebrow">{philosophyData.eyebrow}</span>

        <h2 className="philosophy__title">
          {philosophyData.title.map((line, i) => (
            <span key={i} className="philosophy__title-line">{line}</span>
          ))}
        </h2>

        <p className="philosophy__description">{philosophyData.description}</p>
      </section>
    </section>
  );
};
