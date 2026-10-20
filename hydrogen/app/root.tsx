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
import globalStyles from './styles/globals.css?url';

export type RootLoader = typeof loader;

const META_PIXEL_ID_DEFAULT = '1294973553696322';
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Caveat:wght@600;700&display=swap';
const SHIPROCKET_CSS = 'https://checkout-ui.shiprocket.com/assets/styles/shopify.css';
const SHIPROCKET_JS = 'https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js';

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
      type: 'image/webp',
      href: '/assets/hero-shoes-mobile.webp',
      media: '(max-width: 767px)',
    },
    {
      rel: 'preload',
      as: 'image',
      type: 'image/webp',
      href: '/assets/hero-shoes-desktop.webp',
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

  return {
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
 * Meta Pixel base code. Fires the first PageView exactly like the legacy index.html did;
 * later navigations are tracked in <ScrollToTop>.
 */
const metaPixelScript = (pixelId: string) => `!function (f, b, e, v, n, t, s) {
  if (f.fbq) return; n = f.fbq = function () {
    n.callMethod ?
      n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  };
  if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
  n.queue = []; t = b.createElement(e); t.async = !0;
  t.src = v; s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s)
}(window, document, 'script',
  'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`;

/** Google Fonts load without blocking render, then are switched on (was media="print" onload). */
const fontsScript = `(function(){var l=document.getElementById('thsix-fonts');if(!l)return;function on(){l.media='all'}if(l.sheet){on()}else{l.addEventListener('load',on)}})();`;

/**
 * Shiprocket Checkout: load CSS + JS after first user interaction (scroll/click/touch)
 * or after 4s, whichever comes first, to keep ~75 KB of JS off the critical path.
 */
const shiprocketScript = `(function () {
  var loaded = false;
  function loadShiprocket() {
    if (loaded) return;
    loaded = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${SHIPROCKET_CSS}';
    document.head.appendChild(link);
    var script = document.createElement('script');
    script.src = '${SHIPROCKET_JS}';
    script.defer = true;
    document.head.appendChild(script);
  }
  var events = ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'];
  function onInteraction() {
    loadShiprocket();
    events.forEach(function (e) { window.removeEventListener(e, onInteraction); });
  }
  events.forEach(function (e) { window.addEventListener(e, onInteraction, { once: true, passive: true }); });
  setTimeout(loadShiprocket, 4000);
})();`;

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

        {/* Google Fonts: Inter 700-900 and Caveat 600-700, non-blocking */}
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
        {/* Shiprocket seller domain identifier */}
        <input type="hidden" value="thsix.com" id="sellerDomain" readOnly />
        {children}
        <Scripts nonce={nonce} />
        <script nonce={nonce} dangerouslySetInnerHTML={{__html: shiprocketScript}} />
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
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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
