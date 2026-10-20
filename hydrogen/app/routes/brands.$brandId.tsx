import {data} from 'react-router';
import type {Route} from './+types/brands.$brandId';
import {
  BrandCollectionPage,
  type BrandCollection,
  type BrandProduct,
} from '~/pages/BrandCollectionPage';
import {brandsData} from '~/data/brands';
import {COLLECTION_QUERY} from '~/lib/queries';
import {seoMeta} from '~/lib/seo';

// Brand id -> Shopify collection handle, where they differ
const COLLECTION_HANDLES: Record<string, string> = {
  adidas: 'frontpage',
};

// Shown for Adidas if Shopify can't be reached (legacy behaviour)
const ADIDAS_FALLBACK: {collection: BrandCollection; products: BrandProduct[]} = {
  collection: {
    id: 'adidas-fallback',
    title: 'Collections',
    handle: 'adidas',
    description:
      'Explore our curated collection of Adidas sneakers and sportswear. From the iconic Samba OG to the classic Gazelle, discover timeless designs that blend heritage with modern style.',
  },
  products: [
    {id: 'samba-fallback-1', title: 'Samba Deep Indigo Cream', handle: 'samba-deep-indigo-cream', vendor: 'Adidas', image: '/assets/products/adidas.png', price: '10999.00'},
    {id: 'samba-fallback-2', title: 'Samba Onyx Ivory Gum', handle: 'samba-onyx-ivory-gum', vendor: 'Adidas', image: '/assets/products/adidas.png', price: '10999.00'},
    {id: 'samba-fallback-3', title: 'Samba Evergreen Vanilla Gum', handle: 'samba-evergreen-vanilla-gum', vendor: 'Adidas', image: '/assets/products/adidas.png', price: '10999.00'},
  ],
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {brandId} = params;
  const {storefront} = context;
  const brand = brandsData.find((b) => b.id === brandId);

  if (!brand) {
    return data(
      {brand: null, collection: null, products: [] as BrandProduct[], error: null},
      {status: 404},
    );
  }

  const handle = COLLECTION_HANDLES[brandId] ?? brandId.toLowerCase();
  try {
    const {collection} = await storefront.query(COLLECTION_QUERY, {
      variables: {handle, first: 50},
      cache: storefront.CacheShort(),
    });
    if (!collection) {
      throw new Error(`Collection "${handle}" not found in Shopify`);
    }

    const products: BrandProduct[] = collection.products.nodes.map((p) => {
      const firstVariant = p.variants.nodes[0];
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        vendor: p.vendor,
        image: p.featuredImage?.url ?? null,
        price: firstVariant?.price.amount ?? null,
      };
    });

    return {
      brand,
      collection: {
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        description: collection.description,
        seoTitle: collection.seo?.title ?? null,
        seoDescription: collection.seo?.description ?? null,
      } as BrandCollection,
      products,
      error: null,
    };
  } catch (error) {
    console.error('[brand] Failed to load collection:', error);
    if (brandId === 'adidas') {
      return {brand, ...ADIDAS_FALLBACK, error: null};
    }
    return {
      brand,
      collection: null,
      products: [] as BrandProduct[],
      error: error instanceof Error ? error.message : 'Failed to load collection',
    };
  }
}

export const meta: Route.MetaFunction = ({data: loaderData, matches, params}) => {
  const path = `/brands/${params.brandId}`;
  const brand = loaderData?.brand;
  if (!brand) {
    return seoMeta({matches, path, title: 'Brand Not Found | THSIX', noindex: true});
  }
  const collection = loaderData.collection;
  return seoMeta({
    matches,
    path,
    title: collection?.seoTitle || `${brand.name} Collection | THSIX`,
    description:
      collection?.seoDescription ||
      collection?.description ||
      `Shop ${brand.name} sneakers at THSIX.`,
    image: loaderData.products[0]?.image ?? undefined,
  });
};

export default function BrandRoute({loaderData}: Route.ComponentProps) {
  return <BrandCollectionPage {...loaderData} />;
}
