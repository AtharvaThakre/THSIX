import { HeroImage } from './HeroImage';
import { HeroContent } from './HeroContent';
import { HeroMeta } from './HeroMeta';
import { HeroDecoration } from './HeroDecoration';
import './Hero.css';

const heroData = {
  eyebrow: " ",
  title: ["The evolution begins."],
  description: "Samba was Chapter One. An expanding archive arrives next.",
  cta: "SHOP SAMBAS",
  tags: [" "],
  slide: "1st Drop",
  brandMeta: ["", " ", " "],
  decoration: [" ", " ", " ", " ."]
};

// The intro fades are pure CSS (Hero.css), so the text is visible in the SSR HTML
// and no animation library has to load before the hero is shown.
export const Hero = () => {
  return (
    <section className="hero">
      <HeroImage />
      <HeroContent data={heroData} />
      <HeroDecoration text={heroData.decoration} />
      <HeroMeta slide={heroData.slide} brandMeta={heroData.brandMeta} />
    </section>
  );
};
