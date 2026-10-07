import { useEffect, useState, useRef } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import './ContactPage.css';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

const INITIAL_FIELDS: FormFields = {
  firstName: '',
  lastName: '',
  email: '',
  message: '',
};

export const ContactPage = () => {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const successRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = 'Contact Us | THSIX';
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Scroll to success message for accessibility
  useEffect(() => {
    if (formState === 'success') {
      successRef.current?.focus();
    }
  }, [formState]);

  // GSAP entrance animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let cleanup: (() => void) | undefined;

    const initGsap = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      const targets = section.querySelectorAll('.contact-anim');
      const anim = gsap.fromTo(
        targets,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            once: true,
          },
        }
      );

      return () => {
        anim?.scrollTrigger?.kill();
        anim?.kill();
      };
    };

    initGsap().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear error on user input
    if (formState === 'error') {
      setFormState('idle');
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side pre-check (server validates again)
    if (!fields.firstName.trim() || !fields.lastName.trim() || !fields.email.trim() || !fields.message.trim()) {
      setFormState('error');
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (fields.message.trim().length < 10) {
      setFormState('error');
      setErrorMsg('Message must be at least 10 characters.');
      return;
    }

    setFormState('submitting');
    setErrorMsg('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim(),
          message: fields.message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setFormState('success');
        setFields(INITIAL_FIELDS);
      } else {
        setFormState('error');
        setErrorMsg(
          data.error || 'Something went wrong. Please try again or email us directly.'
        );
      }
    } catch {
      setFormState('error');
      setErrorMsg(
        'Could not reach our server. Please check your connection and try again.'
      );
    }
  };

  const isSubmitting = formState === 'submitting';

  return (
    <>
      <AnnouncementBar />
      <Header />

      <main className="contact-page" ref={sectionRef} id="contact-page">
        <div className="contact-page__inner">

          {/* ── Left panel: Form (70%) ── */}
          <div className="contact-page__form-panel">
            <div className="contact-anim">
              <p className="contact-page__eyebrow">GET IN TOUCH</p>
              <h1 className="contact-page__heading">Contact Us</h1>
              <p className="contact-page__subheading">
                Have a question, feedback, or a collaboration idea?<br />
                We'd love to hear from you.
              </p>
            </div>

            {formState === 'success' ? (
              <div
                className="contact-page__success contact-anim"
                ref={successRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
              >
                <div className="contact-page__success-icon" aria-hidden="true">✓</div>
                <h2 className="contact-page__success-title">Message Sent</h2>
                <p className="contact-page__success-body">
                  Thank you for reaching out. We've received your message and will
                  get back to you as soon as possible.
                </p>
                <button
                  className="contact-page__send-btn"
                  onClick={() => setFormState('idle')}
                  type="button"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form
                className="contact-page__form contact-anim"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Contact form"
              >
                {/* First / Last name row */}
                <div className="contact-page__row">
                  <div className="contact-page__field">
                    <label htmlFor="contact-firstName" className="contact-page__label">
                      First Name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-firstName"
                      name="firstName"
                      type="text"
                      className="contact-page__input"
                      placeholder="Samyak"
                      value={fields.firstName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="given-name"
                      disabled={isSubmitting}
                      aria-required="true"
                    />
                  </div>
                  <div className="contact-page__field">
                    <label htmlFor="contact-lastName" className="contact-page__label">
                      Last Name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-lastName"
                      name="lastName"
                      type="text"
                      className="contact-page__input"
                      placeholder="Matre"
                      value={fields.lastName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="family-name"
                      disabled={isSubmitting}
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="contact-page__field">
                  <label htmlFor="contact-email" className="contact-page__label">
                    Email Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    className="contact-page__input"
                    placeholder="you@example.com"
                    value={fields.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                    autoComplete="email"
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                {/* Message */}
                <div className="contact-page__field">
                  <label htmlFor="contact-message" className="contact-page__label">
                    Message <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="contact-page__textarea"
                    placeholder="Tell us how we can help..."
                    value={fields.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={6}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                  <span className="contact-page__char-count" aria-live="polite">
                    {fields.message.length} / 3000
                  </span>
                </div>

                {/* Error message */}
                {formState === 'error' && (
                  <div
                    className="contact-page__error"
                    role="alert"
                    aria-live="assertive"
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  id="contact-submit"
                  className={`contact-page__send-btn ${isSubmitting ? 'contact-page__send-btn--loading' : ''}`}
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="contact-page__spinner" aria-hidden="true" />
                      SENDING…
                    </>
                  ) : (
                    'SEND MESSAGE'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Right panel: Details (30%) ── */}
          <aside className="contact-page__info-panel contact-anim" aria-label="Contact information">
            <div className="contact-page__info-inner">
              <p className="contact-page__info-eyebrow">OUR DETAILS</p>

              <div className="contact-page__info-block">
                <span className="contact-page__info-label">BRAND</span>
                <a href="https://www.thsix.com" className="contact-page__info-value contact-page__info-link" target="_blank" rel="noopener noreferrer">
                  thsix.com
                </a>
                <span className="contact-page__info-value">Samyak Avinash Matre</span>
              </div>

              <div className="contact-page__info-block">
                <span className="contact-page__info-label">EMAIL</span>
                <a href="mailto:support@thsix.com" className="contact-page__info-value contact-page__info-link">
                  support@thsix.com
                </a>
              </div>

              <div className="contact-page__info-block">
                <span className="contact-page__info-label">PHONE / WHATSAPP</span>
                <a href="tel:+917758879173" className="contact-page__info-value contact-page__info-link">
                  +91 77588 79173
                </a>
              </div>

              <div className="contact-page__info-block">
                <span className="contact-page__info-label">ADDRESS</span>
                <address className="contact-page__info-value contact-page__info-address">
                  Flat No. 201, Chintamani Ruby,<br />
                  8th Mile, Amravati Road,<br />
                  Nagpur, Maharashtra – 440023,<br />
                  India
                </address>
              </div>

              <div className="contact-page__info-divider" aria-hidden="true" />

              <p className="contact-page__info-note">
                We typically respond within 24–48 hours on business days.
              </p>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default ContactPage;
