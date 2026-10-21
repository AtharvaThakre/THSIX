import {redirect} from 'react-router';
import type {Route} from './+types/brands.$brandId';
import {MENU_COLLECTIONS_QUERY} from '~/lib/queries';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Legacy /brands/:brandId URLs (old links, homepage brand cards) -> /collections/:handle.
 * Matches a Shopify collection by handle, or by title ("N I K E" -> "nike").
 */
export async function loader({params, context}: Route.LoaderArgs) {
  const {brandId} = params;
  const fallback = `/collections/${encodeURIComponent(brandId)}`;

  try {
    const {collections} = await context.storefront.query(MENU_COLLECTIONS_QUERY, {
      cache: context.storefront.CacheShort(),
    });
    const exact = collections.nodes.find((c) => c.handle === brandId);
    if (exact) return redirect(`/collections/${encodeURIComponent(exact.handle)}`, 301);

    // A title match ("N I K E" -> nike) or no match can change when Shopify data changes,
    // so don't let browsers cache it permanently
    const wanted = normalize(brandId);
    const byTitle = collections.nodes.find((c) => wanted && normalize(c.title) === wanted);
    return redirect(byTitle ? `/collections/${encodeURIComponent(byTitle.handle)}` : fallback, 302);
  } catch (error) {
    console.error('[brand] Failed to resolve collection:', error);
    // Temporary: don't let a Shopify outage cache a possibly wrong redirect
    return redirect(fallback, 302);
  }
}
