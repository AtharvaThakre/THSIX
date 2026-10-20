import {data} from 'react-router';
import type {Route} from './+types/product.$handle';
import {ProductDetailPage} from '~/pages/ProductDetailPage';
import {PRODUCT_QUERY} from '~/lib/queries';
import {plainText, seoMeta, siteUrlFrom} from '~/lib/seo';

export async function loader({params, context}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle},
    cache: storefront.CacheShort(),
  });

  // Keep the legacy "Product not found" page, but with a real 404 for crawlers
  if (!product) {
    return data({product: null}, {status: 404});
  }
  return {product};
}

export const meta: Route.MetaFunction = ({data: loaderData, matches, params}) => {
  const product = loaderData?.product;
  const path = `/product/${params.handle}`;
  if (!product) {
    return seoMeta({matches, path, title: 'Product not found | THSIX', noindex: true});
  }

  const title = product.seo?.title || `${product.title} | THSIX`;
  const description =
    product.seo?.description || plainText(product.description) || undefined;
  const image = product.images.edges[0]?.node.url;
  const variants = product.variants.edges.map((e) => e.node);
  const siteUrl = siteUrlFrom(matches);

  return seoMeta({
    matches,
    path,
    title,
    description,
    image,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: plainText(product.description),
      image: product.images.edges.map((e) => e.node.url),
      brand: {'@type': 'Brand', name: product.vendor || 'THSIX'},
      url: `${siteUrl}${path}`,
      offers: variants.map((v) => ({
        '@type': 'Offer',
        sku: v.sku || undefined,
        price: v.price.amount,
        priceCurrency: v.price.currencyCode,
        availability: v.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${siteUrl}${path}`,
      })),
    },
  });
};

export default function ProductRoute({loaderData}: Route.ComponentProps) {
  // key: a new product resets size selection, gallery position and checkout state
  return (
    <ProductDetailPage
      key={loaderData.product?.id ?? 'missing'}
      product={loaderData.product}
    />
  );
}
