import {data, redirect} from 'react-router';
import type {Route} from './+types/$';
import {NotFoundPage} from '~/pages/NotFoundPage';
import {brandsData} from '~/data/brands';
import {seoMeta} from '~/lib/seo';

// Shopify Online Store URLs (order emails, old backlinks) -> their THSIX pages
const SHOPIFY_PATHS: Record<string, string> = {
  '/policies/shipping-policy': '/shipping',
  '/policies/refund-policy': '/returns',
  '/policies/terms-of-service': '/terms',
  '/policies/privacy-policy': '/privacy',
  '/pages/about': '/about',
  '/pages/about-us': '/about',
  '/pages/contact': '/contactus',
  '/pages/contact-us': '/contactus',
  '/collections': '/#shop',
  '/collections/all': '/#shop',
  '/collections/frontpage': '/brands/adidas',
};

export async function loader({request}: Route.LoaderArgs) {
  let pathname = new URL(request.url).pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Malformed escape sequence: treat as an unknown page
  }
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // "/about us" (with a space) was a legacy alias of /about
  if (normalized === '/about us') {
    return redirect('/about', 301);
  }

  if (SHOPIFY_PATHS[normalized]) {
    return redirect(SHOPIFY_PATHS[normalized], 301);
  }

  const collection = normalized.match(/^\/collections\/([^/]+)$/)?.[1];
  if (collection && brandsData.some((b) => b.id === collection)) {
    return redirect(`/brands/${collection}`, 301);
  }

  return data(null, {status: 404});
}

export const meta: Route.MetaFunction = ({matches, location}) =>
  seoMeta({matches, path: location.pathname, title: 'Page Not Found | THSIX', noindex: true});

export default NotFoundPage;
