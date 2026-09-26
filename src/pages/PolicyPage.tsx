import { useEffect, useState } from 'react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import './PolicyPage.css';

/**
 * Store policies, read live from Shopify (Settings > Policies) so the site always shows
 * what's written there.
 */
export type PolicyKey = 'shippingPolicy' | 'refundPolicy' | 'termsOfService' | 'privacyPolicy';

const SHOPIFY_DOMAIN = (import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'https://19sjnp-gx.myshopify.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'be59fa0cf086500d7b6456e64f233866';

type Policy = { title: string; body: string };

async function fetchPolicy(key: PolicyKey): Promise<Policy | null> {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: `{ shop { ${key} { title body } } }` }),
  });
  if (!response.ok) throw new Error(`Shopify ${response.status}`);
  const data = await response.json();
  return data?.data?.shop?.[key] ?? null;
}

interface PolicyPageProps {
  policy: PolicyKey;
  // Scroll to the first heading containing this text (e.g. "Payment" inside the Terms)
  section?: string;
}

export const PolicyPage = ({ policy, section }: PolicyPageProps) => {
  const [content, setContent] = useState<Policy | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchPolicy(policy)
      .then((result) => {
        if (cancelled) return;
        setContent(result);
        setStatus(result ? 'ready' : 'error');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [policy]);

  useEffect(() => {
    if (status !== 'ready' || !content) return;
    document.title = `${content.title} | THSIX`;
    if (!section) return;
    const match = [...document.querySelectorAll('.policy-page__body h1, .policy-page__body h2, .policy-page__body h3, .policy-page__body h4, .policy-page__body strong, .policy-page__body p')]
      .find((el) => new RegExp(`\\b${section}\\b`, 'i').test(el.textContent ?? '') && (el.textContent ?? '').length < 60);
    match?.scrollIntoView({ block: 'start' });
  }, [status, content, section]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="policy-page">
        {status === 'loading' && <p className="policy-page__status">Loading…</p>}
        {status === 'error' && (
          <p className="policy-page__status">
            This policy couldn't be loaded. Please email{' '}
            <a href="mailto:support@thsix.com">support@thsix.com</a>.
          </p>
        )}
        {status === 'ready' && content && (
          <article>
            <h1 className="policy-page__title">{content.title}</h1>
            <div className="policy-page__body" dangerouslySetInnerHTML={{ __html: content.body }} />
          </article>
        )}
      </main>
      <Footer />
    </>
  );
};
