import { philosophyData } from '../../data/philosophy';
import './Philosophy.css';

/**
 * The lifestyle photo is a 1254px square. It is full-bleed (sizes=100vw) and
 * blurred by the stylesheet, so 800w serves phones and 1254w (the source's
 * native size) serves 2x and larger screens.
 */
export const Philosophy = () => {
  const imageSrc = philosophyData.image;
  const isDefaultLifestyle = imageSrc?.includes('philosophy-lifestyle');
  const versionParam = imageSrc?.includes('?') ? imageSrc.substring(imageSrc.indexOf('?')) : '';
  const srcSetFor = (ext: 'avif' | 'webp') =>
    `/assets/philosophy-lifestyle.${ext}${versionParam} 800w, /assets/philosophy-lifestyle@2x.${ext}${versionParam} 1254w`;

  return (
    <section className="philosophy" id="about">
      {/* Full-bleed background image */}
      {imageSrc ? (
        <picture>
          {isDefaultLifestyle && (
            <>
              <source srcSet={srcSetFor('avif')} type="image/avif" sizes="100vw" />
              <source srcSet={srcSetFor('webp')} type="image/webp" sizes="100vw" />
            </>
          )}
          <img
            src={imageSrc}
            alt="THSIX Philosophy"
            className="philosophy__image"
            loading="lazy"
            decoding="async"
            width="1254"
            height="1254"
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
