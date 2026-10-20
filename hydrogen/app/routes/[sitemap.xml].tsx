import type {Route} from './+types/[sitemap.xml]';
import {brandsData} from '~/data/brands';
import {SITEMAP_PRODUCTS_QUERY} from '~/lib/queries';

const STATIC_PATHS = [
  '/',
  '/about',
  '/contactus',
  '/shipping',
  '/returns',
  '/terms',
  '/privacy',
];

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// GET /sitemap.xml
export async function loader({request, context}: Route.LoaderArgs) {
  const {storefront, env} = context;
  const origin = (env.WEBSITE_BASE_URL || new URL(request.url).origin).replace(/\/+$/, '');

  let products: {handle: string; updatedAt: string}[] = [];
  try {
    const result = await storefront.query(SITEMAP_PRODUCTS_QUERY, {
      cache: storefront.CacheLong(),
    });
    products = result.products.nodes;
  } catch (error) {
    console.error('[sitemap] Failed to load products:', error);
  }

  const urls = [
    ...STATIC_PATHS.map((path) => ({loc: `${origin}${path}`})),
    ...brandsData
      .filter((brand) => brand.available)
      .map((brand) => ({loc: `${origin}/brands/${brand.id}`})),
    ...products.map((product) => ({
      loc: `${origin}/product/${product.handle}`,
      lastmod: product.updatedAt,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${escapeXml(url.loc)}</loc>${
        'lastmod' in url && url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''
      }</url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60}`,
    },
  });
}
