import type {Route} from './+types/[robots.txt]';

// GET /robots.txt
export async function loader({request, context}: Route.LoaderArgs) {
  const origin = (context.env.WEBSITE_BASE_URL || new URL(request.url).origin).replace(/\/+$/, '');

  const body = `User-agent: *
Disallow: /api/
Disallow: /cart
Disallow: /checkout/
Disallow: /checkouts/
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
