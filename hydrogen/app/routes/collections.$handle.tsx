import {data, redirect} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {Route} from './+types/collections.$handle';
import {CollectionPage} from '~/pages/CollectionPage';
import {COLLECTION_QUERY} from '~/lib/queries';
import {plainText, seoMeta} from '~/lib/seo';

export async function loader({params, request, context}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const variables = getPaginationVariables(request, {pageBy: 24});

  try {
    const {collection} = await storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...variables},
      cache: storefront.CacheShort(),
    });

    // Shopify's built-in "all products" URL: send it to the shop section unless a real collection uses it
    if (!collection && handle === 'all') return redirect('/#shop', 301);

    // Unknown handle: keep the site chrome but answer with a real 404 for crawlers
    if (!collection) {
      return data({state: 'not-found' as const, handle, collection: null}, {status: 404});
    }
    // Shopify matches handles case-insensitively: send /collections/NIKE to the one real URL
    if (collection.handle !== handle) {
      const {search} = new URL(request.url);
      return redirect(`/collections/${encodeURIComponent(collection.handle)}${search}`, 301);
    }
    return {state: 'ok' as const, handle, collection};
  } catch (error) {
    console.error(`[collection] Failed to load "${handle}":`, error);
    return data({state: 'error' as const, handle, collection: null}, {status: 503});
  }
}

export const meta: Route.MetaFunction = ({data: loaderData, matches, params}) => {
  // Canonical never carries pagination cursors
  const path = `/collections/${params.handle}`;
  const collection = loaderData?.collection;
  if (!collection) {
    const title =
      loaderData?.state === 'error' ? 'Collection unavailable | THSIX' : 'Collection not found | THSIX';
    return seoMeta({matches, path, title, noindex: true});
  }

  const title = collection.seo?.title || `${collection.title} | THSIX`;
  const description =
    collection.seo?.description ||
    plainText(collection.description) ||
    `Shop the ${collection.title} collection at THSIX. Explore premium inspired sneakers and footwear.`;
  const image =
    collection.image?.url || collection.products.nodes[0]?.selectedOrFirstAvailableVariant?.image?.url;
  // An empty collection is a thin page: keep it out of search results until it has products
  const noindex = collection.products.nodes.length === 0;

  return seoMeta({matches, path, title, description, image, noindex});
};

export default function CollectionRoute({loaderData}: Route.ComponentProps) {
  // key: a different collection resets the accumulated "load more" state
  return <CollectionPage key={loaderData.handle} {...loaderData} />;
}
