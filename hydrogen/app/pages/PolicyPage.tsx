import { useEffect } from 'react';
import type { AppLoadContext, MetaDescriptor } from 'react-router';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { STATIC_POLICIES } from '../data/policies';
import { POLICIES_QUERY } from '../lib/queries';
import { plainText, seoMeta } from '../lib/seo';
import './PolicyPage.css';

/**
 * Store policies, read from STATIC_POLICIES or (server-side) from Shopify Settings > Policies.
 */
export type PolicyKey = 'shippingPolicy' | 'refundPolicy' | 'termsOfService' | 'privacyPolicy';

export type Policy = { title: string; body: string };

function cleanBody(body: string): string {
  // Strip duplicate h1 at the start of body if Shopify already has it in the title
  return body.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
}

/** Used by the policy routes' loaders. */
export async function loadPolicy(
  context: AppLoadContext,
  key: PolicyKey,
): Promise<{ policy: Policy | null }> {
  const staticContent = STATIC_POLICIES[key];
  if (staticContent) return { policy: staticContent };

  try {
    const { storefront } = context;
    const { shop } = await storefront.query(POLICIES_QUERY, {
      cache: storefront.CacheLong(),
    });
    const policy = shop[key];
    return { policy: policy ? { title: policy.title, body: cleanBody(policy.body) } : null };
  } catch (error) {
    console.error(`[policy] Failed to load ${key}:`, error);
    return { policy: null };
  }
}

/** Used by the policy routes' meta functions. */
export function policyMeta(
  policy: Policy | null | undefined,
  path: string,
  matches: Parameters<typeof seoMeta>[0]['matches'],
): MetaDescriptor[] {
  return seoMeta({
    matches,
    path,
    title: policy ? `${policy.title} | THSIX` : 'Policy | THSIX',
    description: policy ? plainText(policy.body).slice(0, 160) : undefined,
  });
}

interface PolicyPageProps {
  policy: Policy | null;
  // Scroll to the first heading containing this text (e.g. "Payment" inside the Terms)
  section?: string;
}

export const PolicyPage = ({ policy, section }: PolicyPageProps) => {
  useEffect(() => {
    if (!policy || !section) return;
    const match = [...document.querySelectorAll('.policy-page__body h1, .policy-page__body h2, .policy-page__body h3, .policy-page__body h4, .policy-page__body strong, .policy-page__body p')]
      .find((el) => new RegExp(`\\b${section}\\b`, 'i').test(el.textContent ?? '') && (el.textContent ?? '').length < 60);
    match?.scrollIntoView({ block: 'start' });
  }, [policy, section]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="policy-page">
        {!policy && (
          <p className="policy-page__status">
            This policy couldn&apos;t be loaded. Please email{' '}
            <a href="mailto:support@thsix.com">support@thsix.com</a>.
          </p>
        )}
        {policy && (
          <article>
            <h1 className="policy-page__title">{policy.title}</h1>
            <div className="policy-page__body" dangerouslySetInnerHTML={{ __html: policy.body }} />
          </article>
        )}
      </main>
      <Footer />
    </>
  );
};
