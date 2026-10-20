import type {MetaDescriptor} from 'react-router';

/**
 * Per-route SEO tags. React Router replaces (not merges) parent meta, so every route builds
 * the full set here: title, description, canonical, Open Graph, Twitter and optional JSON-LD.
 * The tag set and default copy match the legacy index.html.
 */
export const DEFAULT_SITE_URL = 'https://www.thsix.com';
export const DEFAULT_TITLE = 'THSIX - Premium Inspired Sneakers & Footwear | Upto 60% off';
export const DEFAULT_DESCRIPTION =
  'Discover premium inspired sneakers at THSIX. Explore curated styles, modern colourways, and exclusive footwear drops designed for your everyday rotation.';
export const DEFAULT_IMAGE_PATH = '/assets/hero-shoes-desktop.webp';

type MatchLike = {id: string; loaderData?: unknown} | undefined;

/** Canonical origin from the root loader (WEBSITE_BASE_URL), falling back to production. */
export function siteUrlFrom(matches: readonly MatchLike[] | undefined): string {
  const root = matches?.find((m) => m?.id === 'root')?.loaderData as
    | {siteUrl?: string}
    | undefined;
  return (root?.siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

export function seoMeta({
  matches,
  path,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}: {
  matches?: readonly MatchLike[];
  path: string;
  title?: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}): MetaDescriptor[] {
  const siteUrl = siteUrlFrom(matches);
  const url = `${siteUrl}${path === '/' ? '/' : path}`;
  const imageUrl = !image
    ? `${siteUrl}${DEFAULT_IMAGE_PATH}`
    : image.startsWith('http')
      ? image
      : `${siteUrl}${image}`;
  const desc = truncate(description.replace(/\s+/g, ' ').trim(), 160);

  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: desc},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:type', content: type},
    {property: 'og:site_name', content: 'THSIX'},
    {property: 'og:url', content: url},
    {property: 'og:title', content: title},
    {property: 'og:description', content: desc},
    {property: 'og:image', content: imageUrl},
    {property: 'twitter:card', content: 'summary_large_image'},
    {property: 'twitter:url', content: url},
    {property: 'twitter:title', content: title},
    {property: 'twitter:description', content: desc},
    {property: 'twitter:image', content: imageUrl},
  ];
  if (noindex) tags.push({name: 'robots', content: 'noindex, nofollow'});
  if (jsonLd) tags.push({'script:ld+json': jsonLd});
  return tags;
}

/** Cut at a word boundary so search snippets don't end mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

/** Strip tags from Shopify HTML for meta descriptions. */
export function plainText(html: string | null | undefined): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
