import { Logo } from '../Header/Logo';
import { FooterColumnComponent } from './FooterColumn';
import { SocialLinks } from './SocialLinks';
import { footerColumns, footerLegal, socialLinks } from '../../data/footer';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Top grid: logo + nav columns */}
        <div className="footer__top">
          {/* Logo area */}
          <div className="footer__brand">
            <Logo />
            <p className="footer__tagline">STYLE BEYOND BASICS.</p>
          </div>

          {/* Nav columns */}
          <nav className="footer__nav" aria-label="Footer navigation">
            {footerColumns.map((col) => (
              <FooterColumnComponent key={col.title} column={col} />
            ))}
          </nav>

          {/* Follow Us */}
          <div className="footer__follow">
            <h3 className="footer-col__heading">FOLLOW US</h3>
            <SocialLinks links={socialLinks} />
          </div>
        </div>

        {/* Divider */}
        <hr className="footer__divider" />

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
