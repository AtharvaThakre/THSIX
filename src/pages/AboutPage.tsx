import { useEffect } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import './PolicyPage.css';

export const AboutPage = () => {
  useEffect(() => {
    document.title = 'About thsix | THSIX';
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="policy-page">
        <article>
          <h1 className="policy-page__title">About thsix</h1>
          <div className="policy-page__body">
            <p>
              Sneakers shouldn’t be a luxury. At <strong>thsix</strong>, we believe great footwear is built on five things: design, comfort, quality, performance, and price. Most brands give you four and charge a premium for the fifth.
            </p>

            <p>
              <strong>thsix is the sixth.</strong>
            </p>

            <p>
              The name comes from “the sixth” – the extra element that completes the sneaker. For us, that sixth element is <strong>access</strong>: bringing well‑made, familiar styles to more people, at prices that make sense.
            </p>

            <p>
              <strong>We focus on:</strong>
            </p>
            <ul>
              <li><strong>Proven styles</strong> you already love</li>
              <li><strong>Top‑notch quality</strong> in materials and build</li>
              <li><strong>Honest pricing</strong> without the hype markup</li>
            </ul>

            <p>
              thsix is for anyone who wants sneakers that look good, feel solid, and fit real life – no designer tax, no limited‑drop stress.
            </p>

            <p>
              <strong><em>Five makes it good. The sixth makes it yours.</em></strong>
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
