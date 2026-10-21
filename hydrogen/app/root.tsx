import {Analytics, useNonce} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
  useRouteLoaderData,
  type ShouldRevalidateFunction,
} from 'react-router';
import type {Route} from './+types/root';
import {CartProvider} from './contexts/CartContext';
import {Preloader} from './components/Preloader/Preloader';
import {CartManager} from './components/Cart/CartManager';
import {CheckoutNotice} from './components/Cart/CheckoutNotice';
import {initGA4, trackGA4PageView} from './utils/ga4';
import {seoMeta, DEFAULT_SITE_URL} from './lib/seo';
import {normalizeStorefrontId} from './lib/storefront-id';
import {MENU_COLLECTIONS_QUERY} from './lib/queries';
import globalStyles from './styles/globals.css?url';

export type RootLoader = typeof loader;

const META_PIXEL_ID_DEFAULT = '1294973553696322';
// Only the weights the CSS uses: Inter 700/800/900 (400-700 text renders with the 700 face) and
// Caveat 600 (the decorative 400-weight text renders with the 600 face). Changing these changes the look.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Caveat:wght@600&display=swap';

/**
 * The root loader data (public env, analytics shop) never changes between navigations,
 * so only revalidate after mutations or an explicit revalidation.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

// Fallback for routes without their own meta; every page route builds its own via seoMeta()
export const meta: Route.MetaFunction = ({matches, location}) =>
  seoMeta({matches, path: location.pathname});

export function links() {
  return [
    {rel: 'stylesheet', href: globalStyles},
    {rel: 'icon', type: 'image/png', href: '/favicon.png'},
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const},
    {rel: 'preconnect', href: 'https://cdn.shopify.com', crossOrigin: 'anonymous' as const},
    // Preload the LCP hero poster
    {
      rel: 'preload',
      as: 'image',
      type: 'image/avif',
      href: '/assets/hero-shoes-mobile.avif',
      media: '(max-width: 767px)',
    },
    {
      rel: 'preload',
      as: 'image',
      type: 'image/avif',
      href: '/assets/hero-shoes-desktop.avif',
      media: '(min-width: 768px)',
    },
  ];
}

export async function loader({context}: Route.LoaderArgs) {
  const {env} = context;

  // PUBLIC_SHOPIFY_SHOP_ID if set, else Oxygen's injected numeric SHOP_ID
  const shopId =
    env.PUBLIC_SHOPIFY_SHOP_ID ||
    (env.SHOP_ID ? `gid://shopify/Shop/${env.SHOP_ID}` : 'gid://shopify/Shop/78307623077');
  // Hydrogen storefront ID (Oxygen injects it; locally it comes from .env via `shopify hydrogen link`)
  const storefrontId = normalizeStorefrontId(env.PUBLIC_STOREFRONT_ID);
  if (!storefrontId) {
    console.error(
      '[analytics] PUBLIC_STOREFRONT_ID is not set: Shopify analytics and Live View are disabled.',
    );
  }

  // Collections for the menu drawer. Not awaited: it streams in after the shell, so it never
  // delays the first byte. null = Shopify unreachable (the menu shows an error state).
  // Runs on every document request, so it is cached for a minute (refreshed in the background
  // for 10 more): a collection added or removed in Shopify shows up within about a minute.
  const menuCollections = context.storefront
    .query(MENU_COLLECTIONS_QUERY, {
      cache: context.storefront.CacheCustom({mode: 'public', maxAge: 60, staleWhileRevalidate: 600}),
    })
    .then(({collections}) => collections.nodes)
    .catch((error: unknown) => {
      console.error('[menu] Failed to load collections:', error);
      return null;
    });

  return {
    menuCollections,
    // Written to window.ENV by <Layout> so client modules (lib/config.ts) can read them
    ENV: {
      PUBLIC_SHOPIFY_SHOP_ID: shopId,
      PUBLIC_GA4_MEASUREMENT_ID: env.PUBLIC_GA4_MEASUREMENT_ID ?? '',
      PUBLIC_META_PIXEL_ID:
        env.PUBLIC_META_PIXEL_ID || env.META_PIXEL_ID || META_PIXEL_ID_DEFAULT,
      PUBLIC_STOREFRONT_ID: storefrontId,
    },
    // Canonical/OG origin for seoMeta()
    siteUrl: env.WEBSITE_BASE_URL || DEFAULT_SITE_URL,
    // Shape expected by <Analytics.Provider> (what getShopAnalytics() returns). Built from env
    // because THSIX already knows its shop GID and only sells in INR. Without a storefront ID
    // the provider is not given a shop, so no event is sent under a wrong ("0") storefront.
    shop: storefrontId
      ? {
          shopId,
          acceptedLanguage: 'EN' as const,
          currency: 'INR' as const,
          hydrogenSubchannelId: storefrontId,
        }
      : null,
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || env.PUBLIC_STORE_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  };
}

/**
 * Meta Pixel. The fbq stub and queue are inline here, so init and the first PageView are
 * queued at once and fbevents.js processes them when it arrives. fbevents.js itself is injected
 * only after the window load event and an idle period (or the first user interaction, or an 8s
 * cap if load is held up). Later navigations are tracked in <ScrollToTop>.
 */
const metaPixelScript = (pixelId: string) => `!function (f, b) {
  if (f.fbq) return; var n = f.fbq = function () {
    n.callMethod ?
      n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  };
  if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
  n.queue = [];
}(window, document);
fbq('init', '${pixelId}');
fbq('track', 'PageView');
(function () {
  var loaded = false;
  var events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  function loadPixel() {
    if (loaded) return;
    loaded = true;
    events.forEach(function (e) { window.removeEventListener(e, loadPixel); });
    var t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
  }
  function whenIdle() {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadPixel, { timeout: 3500 });
    else setTimeout(loadPixel, 1000);
  }
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
  events.forEach(function (e) { window.addEventListener(e, loadPixel, { once: true, passive: true }); });
  setTimeout(loadPixel, 8000);
})();`;

/** Google Fonts load without blocking render, then are switched on (was media="print" onload). */
const fontsScript = `(function(){var l=document.getElementById('thsix-fonts');if(!l)return;function on(){l.media='all'}if(l.sheet){on()}else{l.addEventListener('load',on)}})();`;

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const pixelId = data?.ENV.PUBLIC_META_PIXEL_ID || META_PIXEL_ID_DEFAULT;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <Meta />
        <Links />

        {/* Google Fonts: Inter 700-900 and Caveat 600, non-blocking */}
        <link id="thsix-fonts" rel="stylesheet" href={FONTS_HREF} media="print" />
        <noscript>
          <link rel="stylesheet" href={FONTS_HREF} />
        </noscript>
        <script nonce={nonce} dangerouslySetInnerHTML={{__html: fontsScript}} />

        {/* Public env for client modules (read by lib/config.ts) */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV=${JSON.stringify(data?.ENV ?? {}).replace(/</g, '\\u003c')};`,
          }}
        />

        {/* Meta Pixel */}
        <script nonce={nonce} dangerouslySetInnerHTML={{__html: metaPixelScript(pixelId)}} />
        <noscript>
          <img
            height="1"
            width="1"
            style={{display: 'none'}}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body>
        {/* Shiprocket seller domain identifier (read by the checkout script loaded on demand) */}
        <input type="hidden" value="thsix.com" id="sellerDomain" readOnly />
        {children}
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

/**
 * Scroll to top on route change and track SPA page views.
 * Shopify page views are published by <Analytics.Provider> itself; Meta Pixel and GA4 are
 * skipped on the first render because the head script already fired the first PageView.
 */
function ScrollToTop() {
  const {pathname} = useLocation();
  // Path of the last page view sent. The landing view is already counted (Meta head script,
  // initGA4). Compared by value, so StrictMode's double effect in dev can't send a duplicate.
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (trackedPath.current === null) {
      trackedPath.current = pathname;
      return;
    }
    if (trackedPath.current === pathname) return;
    trackedPath.current = pathname;

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
    trackGA4PageView(pathname);
  }, [pathname]);

  return null;
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  // Initialise GA4 once (no-op if PUBLIC_GA4_MEASUREMENT_ID is not set)
  useEffect(() => {
    initGA4();
  }, []);

  if (!data) {
    return <Outlet />;
  }

  return (
    // THSIX keeps its cart in localStorage + Shiprocket (not a Shopify cart), hence cart={null}
    <Analytics.Provider cart={null} shop={data.shop} consent={data.consent}>
      <CartProvider>
          {/* Preloader - shown on initial page load */}
          <Preloader />

          <ScrollToTop />

          {/* Cart System */}
          <CartManager />
          <CheckoutNotice />

          <Outlet />
      </CartProvider>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '64px 16px',
        textAlign: 'center',
      }}
    >
      <h1 style={{fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em'}}>
        SOMETHING WENT WRONG
      </h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <pre style={{color: '#666', whiteSpace: 'pre-wrap'}}>{String(errorMessage)}</pre>
      )}
      <a
        href="/"
        style={{
          padding: '14px 28px',
          background: '#111',
          color: '#fff',
          fontSize: '13px',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        BACK TO HOME
      </a>
    </div>
  );
}
