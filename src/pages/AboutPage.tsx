import { useEffect } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import './PolicyPage.css';

export const AboutPage = () => {
  useEffect(() => {
    document.title = 'About THSIX | THSIX';
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="policy-page">
        <article>
          <h1 className="policy-page__title">About THSIX</h1>
          <div className="policy-page__body">
            <h2>The Sixth Element.</h2>

            <p>
              <strong>THSIX is an India-based premium footwear marketplace built around one simple idea: premium style should be more accessible.</strong>
            </p>

            <p>
              We believe great footwear is more than just something you wear. It is a part of your identity, your style, and the way you move through the world.
            </p>

            <p>
              THSIX was created to bridge the gap between premium footwear and accessible pricing. We work through reliable sourcing channels to bring carefully selected footwear to customers who value <strong>style, quality, and value</strong> without wanting to pay unnecessarily high retail prices.
            </p>

            <h3>Premium Style. Better Value.</h3>

            <p>
              The footwear industry often comes with a simple equation — higher price, better style.
            </p>

            <p>
              We believe it can be different.
            </p>

            <p>
              At THSIX, our focus is on finding products that deliver the look, feel, and appeal our customers are looking for while maintaining a more accessible value proposition.
            </p>

            <p>
              Every product we offer is selected with attention to its design, quality, versatility, and overall value.
            </p>

            <p>
              Our goal is not simply to sell footwear.
            </p>

            <p>
              <strong>Our goal is to make premium style easier to access.</strong>
            </p>

            <h2>What THSIX Stands For</h2>

            <h3>Style</h3>
            <p>
              We believe footwear is an important part of personal expression. Our selections are influenced by contemporary fashion, streetwear, lifestyle culture, and evolving trends.
            </p>

            <h3>Quality</h3>
            <p>
              We aim to source products through reliable supply channels and maintain appropriate quality standards across the products we offer.
            </p>

            <h3>Value</h3>
            <p>
              Premium does not always have to mean expensive. We work towards offering customers better value while keeping the experience premium.
            </p>

            <h3>Trust</h3>
            <p>
              A great product means little without a trustworthy shopping experience. We aim to maintain clear communication, transparent policies, and reliable customer support throughout the buying journey.
            </p>

            <h2>Our Vision</h2>

            <p>
              Our vision is to build THSIX into a recognised footwear marketplace in India — a destination where customers can discover premium-looking, carefully selected footwear at accessible prices.
            </p>

            <p>
              We want THSIX to become more than an online store.
            </p>

            <p>
              <strong>We want it to become a part of the footwear culture.</strong>
            </p>

            <h2>Our Approach</h2>

            <p>
              From product sourcing to customer experience, we believe in keeping things simple:
            </p>

            <p>
              <strong>
                Find better products.<br />
                Offer better value.<br />
                Create a better experience.
              </strong>
            </p>

            <p>
              As THSIX grows, we continue to explore new styles, products, and possibilities while staying focused on what matters most — our customers and the products we put in front of them.
            </p>

            <h2>Why the Name THSIX?</h2>

            <p>
              <strong>THSIX — The Sixth Element.</strong>
            </p>

            <p>
              The name represents the idea of something beyond the ordinary.
            </p>

            <p>
              While the traditional elements represent the fundamentals of the world around us, <strong>the sixth element represents individuality, movement, culture, and expression.</strong>
            </p>

            <p>
              That is what THSIX represents for us.
            </p>

            <p>
              <strong>
                Not just footwear.<br />
                An element of who you are.
              </strong>
            </p>

            <h2>Our Business</h2>

            <p>
              <strong>Business Name:</strong> thsix.com<br />
              <strong>Business Type:</strong> Sole Proprietorship<br />
              <strong>Business Owner:</strong> Samyak Avinash Matre<br />
              <strong>Industry:</strong> E-commerce / Footwear
            </p>

            <p>
              <strong>Registered Business Address:</strong><br />
              Flat No. 201, Chintamani Ruby,<br />
              8th Mile, Amravati Road,<br />
              Nagpur, Maharashtra – 440023, India
            </p>

            <p>
              <strong>Contact:</strong> <a href="tel:+917758879173">+91 7758879173</a><br />
              <strong>Email:</strong> <a href="mailto:support@thsix.com">support@thsix.com</a><br />
              <strong>Website:</strong> <a href="https://www.thsix.com" target="_blank" rel="noopener noreferrer">www.thsix.com</a>
            </p>

            <p>
              THSIX currently operates as an online footwear business through its official website and serves customers across India.
            </p>

            <p>
              For questions regarding products, orders, payments, shipping, returns, refunds, or other business-related matters, customers can contact us using the details provided above.
            </p>

            <h2>Welcome to THSIX.</h2>

            <p>
              <strong>The Sixth Element.</strong>
            </p>

            <p>
              Where premium style meets better value.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
