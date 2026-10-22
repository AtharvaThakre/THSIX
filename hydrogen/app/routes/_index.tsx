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
    // One request: all products plus each collection's first products (rows for empty collections are dropped).
    // 250 collections = the menu's limit, so every collection with products gets a row; 20 cards per
    // row, the rest are one 'View all' away. Query cost at these limits: 288 (checked against Shopify).
    const {products, collections} = await storefront.query(HOME_PRODUCTS_QUERY, {
      variables: {first: 250, collections: 250, perCollection: 20},
      cache: storefront.CacheShort(),
    });
    return {
      products: products.nodes,
      collections: collections.nodes
        .filter((collection) => collection.products.nodes.length > 0)
        .map(({id, handle, title, products: collectionProducts}) => ({
          id,
          handle,
          title,
          products: collectionProducts.nodes,
        })),
      error: false,
    };
  } catch (error) {
    // The carousels are one section of the home page; render the rest if Shopify is down
    console.error('[home] Failed to load products:', error);
    return {products: [], collections: [], error: true};
  }
}

export default function Index({loaderData}: Route.ComponentProps) {
  return (
    <HomePage
      products={loaderData.products}
      collections={loaderData.collections}
      error={loaderData.error}
    />
  );
}
