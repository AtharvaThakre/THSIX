import type { FooterColumn } from '../../data/footer';

interface FooterColumnProps {
  column: FooterColumn;
}

export const FooterColumnComponent = ({ column }: FooterColumnProps) => {
  return (
    <div className="footer-col">
      <h3 className="footer-col__heading">{column.title}</h3>
      <ul className="footer-col__list">
        {column.links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="footer-col__link">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
