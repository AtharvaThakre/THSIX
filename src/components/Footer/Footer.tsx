import { FooterColumnComponent } from './FooterColumn';
import { SocialLinks } from './SocialLinks';
import { footerColumns, footerLegal, socialLinks } from '../../data/footer';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      {/* Gradient banner with THSIX text centered */}
      <div className="footer__gradient-banner">
        <div className="footer__banner-text">
          <h1 className="footer__brand-text">THSIX</h1>
        </div>
      </div>

      <div className="footer__container">
        {/* Full-width divider under the banner */}
        <hr className="footer__divider" />

        {/* 4-column nav grid */}
        <div className="footer__top">
          <nav className="footer__nav" aria-label="Footer navigation">
            {footerColumns.map((col) => {
              // Special handling for FOLLOW US column
              if (col.title === 'FOLLOW US') {
                return (
                  <div key={col.title} className="footer-col">
                    <h3 className="footer-col__heading">{col.title}</h3>
                    <SocialLinks links={socialLinks} />
                  </div>
                );
              }
              return <FooterColumnComponent key={col.title} column={col} />;
            })}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="footer__bottom">
          <p className="footer__copyright">{footerLegal.copyright}</p>
          <div className="footer__legal">
            {footerLegal.links.map((link) => (
              <a key={link.label} href={link.href} className="footer__legal-link">
                {link.label}
              </a>
            ))}
            <span className="footer__legal-tagline">{footerLegal.tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
