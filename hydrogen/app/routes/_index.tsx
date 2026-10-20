import type {Route} from './+types/_index';
import {HomePage} from '~/pages/HomePage';
import {HOME_PRODUCTS_QUERY} from '~/lib/queries';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({matches}) =>
  seoMeta({
    matches,
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'THSIX',
      url: 'https://www.thsix.com/',
      logo: 'https://www.thsix.com/assets/logo.png',
    },
  });

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  try {
    const {products} = await storefront.query(HOME_PRODUCTS_QUERY, {
      variables: {first: 250},
      cache: storefront.CacheShort(),
    });
    return {products: products.nodes};
  } catch (error) {
    // The carousel is one section of the home page; render the rest if Shopify is down
    console.error('[home] Failed to load products:', error);
    return {products: []};
  }
}

export default function Index({loaderData}: Route.ComponentProps) {
  return <HomePage products={loaderData.products} />;
}
