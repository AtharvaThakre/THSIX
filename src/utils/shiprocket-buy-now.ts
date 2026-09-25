/**
 * Shiprocket Buy Now Handler
 * Intercepts "Buy Now" clicks and routes them through Shiprocket instead of Shopify
 *
 * FIX (2026-09-25): The root cause of the "No selected variant found" error was that
 * the handler polled `shopify-store.product` — but in Shopify Web Components, the
 * per-product-page selected variant lives on `shopify-context[type="product"]`, not
 * on the global shopify-store element.
 *
 * Three new detection mechanisms added:
 *  1. variantchange custom event (Shopify Web Components fire this on every size change)
 *  2. Click listener on variant-selector area + delayed shopify-context read
 *  3. MutationObserver on shopify-context[type="product"] elements
 */

import { loadPickrrScript } from './pickrr-loader';
import { waitForShiprocket, checkoutWithProducts } from '../services/shiprocket-shopify';

/**
 * Extract numeric variant ID from various Shopify variant ID formats
 */
function extractNumericVariantId(variantId: string | number): string {
  if (typeof variantId === 'number') {
    return variantId.toString();
  }
  
  // Remove GID prefix: "gid://shopify/ProductVariant/123456" -> "123456"
  if (variantId.includes('ProductVariant/')) {
    return variantId.split('ProductVariant/').pop() || variantId;
  }
  
  // Extract numeric part (variant IDs are 8+ digits)
  const numericMatch = variantId.match(/\d{8,}/);
  return numericMatch ? numericMatch[0] : variantId;
}

/**
 * Read selected variant from shopify-context[type="product"].
 * This is the authoritative source when using Shopify Web Components.
 */
function getVariantFromShopifyContext(): string | null {
  try {
    const contexts = Array.from(document.querySelectorAll('shopify-context[type="product"]'));
    for (let i = 0; i < contexts.length; i++) {
      const el = contexts[i] as any;
      const productData =
        el.product || el.__product || el._product ||
        el.state?.product || el.context?.product;

      if (!productData) continue;

      const variant =
        productData.selectedOrFirstAvailableVariant ||
        productData.selectedVariant ||
        productData.currentVariant;

      if (variant?.id) {
        const numericId = extractNumericVariantId(variant.id);
        console.log('[ShiprocketBuyNow] Variant from shopify-context:', numericId, variant.title);
        return numericId;
      }
    }
  } catch (e) {
    console.warn('[ShiprocketBuyNow] Could not read shopify-context:', e);
  }
  return null;
}

/**
 * Get selected variant ID using all available methods in priority order.
 */
function getSelectedVariantId(): string | null {
  console.log('[ShiprocketBuyNow] === Resolving selected variant ID ===');

  // Priority 1: Global tracker (updated by event listeners)
  const tracked = (window as any).selectedVariantId;
  if (tracked && String(tracked).length >= 8) {
    console.log('[ShiprocketBuyNow] P1 Global tracker:', tracked);
    return extractNumericVariantId(tracked);
  }

  // Priority 2: shopify-context (NEW — correct source for Web Components)
  const fromContext = getVariantFromShopifyContext();
  if (fromContext && fromContext.length >= 8) {
    console.log('[ShiprocketBuyNow] P2 shopify-context:', fromContext);
    return fromContext;
  }

  // Priority 3: Checked radio button + variant lookup
  try {
    const checkedRadio = document.querySelector(
      'input[type="radio"][name*="option-"]:checked'
    ) as HTMLInputElement | null;

    if (checkedRadio) {
      const selectedSize = checkedRadio.value;
      console.log('[ShiprocketBuyNow] P3 Checked radio size:', selectedSize);

      const shopifyStore = document.querySelector('shopify-store') as any;
      const productData =
        shopifyStore?.product || shopifyStore?.__product || shopifyStore?.state?.product;

      if (productData?.variants) {
        const match = productData.variants.find((v: any) =>
          v.options?.some((o: any) => o.value === selectedSize) ||
          v.selectedOptions?.some((o: any) => o.value === selectedSize) ||
          v.title?.includes(selectedSize)
        );
        if (match?.id) {
          const id = extractNumericVariantId(match.id);
          console.log('[ShiprocketBuyNow] P3 Found variant for size', selectedSize, ':', id);
          return id;
        }
      }
    }
  } catch (e) {
    console.warn('[ShiprocketBuyNow] Could not resolve variant from radio:', e);
  }

  // Priority 4: shopify-store selectedOrFirstAvailableVariant
  try {
    const shopifyStore = document.querySelector('shopify-store') as any;
    if (shopifyStore) {
      const productData =
        shopifyStore.product || shopifyStore.__product || shopifyStore.state?.product;
      const variant =
        productData?.selectedOrFirstAvailableVariant || productData?.selectedVariant;
      if (variant?.id) {
        console.log('[ShiprocketBuyNow] P4 shopify-store:', variant.id);
        return extractNumericVariantId(variant.id);
      }
    }
  } catch (e) {
    console.warn('[ShiprocketBuyNow] Could not read shopify-store:', e);
  }

  // Priority 5: URL ?variant= param
  const urlVariant = new URLSearchParams(window.location.search).get('variant');
  if (urlVariant) {
    console.log('[ShiprocketBuyNow] P5 URL param:', urlVariant);
    return extractNumericVariantId(urlVariant);
  }

  // Priority 6: product-form hidden input
  try {
    const form = document.querySelector('product-form form') as HTMLFormElement | null;
    const input = form?.querySelector('input[name="id"]') as HTMLInputElement | null;
    if (input?.value && input.value.length >= 8) {
      console.log('[ShiprocketBuyNow] P6 form input:', input.value);
      return extractNumericVariantId(input.value);
    }
  } catch (e) {
    console.warn('[ShiprocketBuyNow] Could not read form input:', e);
  }

  console.log('[ShiprocketBuyNow] No variant ID found from any source');
  return null;
}

/**
 * Handle Buy Now button click.
 * Uses Shiprocket direct product checkout (type: 'product').
 */
export async function handleBuyNow(event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  const buyButton = event.target as HTMLButtonElement;
  const originalText = buyButton.textContent;

  // Prevent duplicate requests
  if (buyButton.disabled) return;

  try {
    console.log('[ShiprocketBuyNow] Buy Now clicked - Shiprocket direct checkout');

    // Step 1: Resolve selected variant
    const variantId = getSelectedVariantId();

    console.log('[ShiprocketBuyNow] Resolved variant ID:', variantId);

    if (!variantId) {
      throw new Error('Please select a size before proceeding to checkout.');
    }

    if (variantId.length < 8 || isNaN(Number(variantId))) {
      throw new Error('Invalid variant ID detected. Please refresh and try again.');
    }

    console.log('[ShiprocketBuyNow] Final variant ID:', variantId);

    // Step 2: Show loading state
    buyButton.disabled = true;
    buyButton.textContent = 'Loading...';

    // Step 3: Load Shiprocket/Pickrr script
    console.log('[ShiprocketBuyNow] Loading Shiprocket integration...');
    await loadPickrrScript();

    // Step 4: Wait for Shiprocket to be ready
    const isReady = await waitForShiprocket(10000);
    if (!isReady) {
      throw new Error('Checkout service is unavailable. Please refresh and try again.');
    }

    console.log('[ShiprocketBuyNow] Shiprocket ready. Initiating checkout with variant:', variantId);

    // Step 5: Trigger Shiprocket direct product checkout (bypasses cart)
    checkoutWithProducts([{ variantId, quantity: 1 }]);

    console.log('[ShiprocketBuyNow] Buy Now initiated successfully');

    setTimeout(() => {
      buyButton.disabled = false;
      buyButton.textContent = originalText || 'Buy Now';
    }, 3000);

  } catch (error) {
    console.error('[ShiprocketBuyNow] Error:', error);

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to initiate checkout. Please try again.'
    );

    buyButton.disabled = false;
    buyButton.textContent = originalText || 'Buy Now';
  }
}

/**
 * Initialize the Buy Now handler globally.
 * Called once from App.tsx on mount.
 */
export function initializeBuyNowHandler(): void {
  (window as any).handleBuyNow = handleBuyNow;
  (window as any).selectedVariantId = null;

  console.log('[ShiprocketBuyNow] Initializing handler...');

  // ─── Listener 1: variantchange custom event (Shopify Web Components) ─────────
  // Shopify Web Components fire 'variantchange' on every user size selection.
  const onVariantChange = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    console.log('[ShiprocketBuyNow] variantchange event:', detail);

    const variant = detail?.variant || detail?.selectedVariant || detail;
    if (variant?.id) {
      const id = extractNumericVariantId(variant.id);
      if (id && id.length >= 8) {
        (window as any).selectedVariantId = id;
        console.log('[ShiprocketBuyNow] Variant from variantchange event:', id);
      }
    }
  };

  document.addEventListener('variantchange', onVariantChange, true);
  document.addEventListener('variant:change', onVariantChange, true);

  // ─── Listener 2: Click on variant-selector options (shadow DOM-safe) ─────────
  // shopify-variant-selector renders in shadow DOM; we capture at document level
  // then read the updated state from shopify-context after a short delay.
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const isVariantOption =
      target.closest('shopify-variant-selector') !== null ||
      target.matches('[data-option-value], [data-variant-option]') ||
      (target instanceof HTMLInputElement &&
        target.type === 'radio' &&
        target.name.includes('option'));

    if (!isVariantOption) return;

    setTimeout(() => {
      // Try shopify-context first
      const fromCtx = getVariantFromShopifyContext();
      if (fromCtx && fromCtx.length >= 8) {
        (window as any).selectedVariantId = fromCtx;
        console.log('[ShiprocketBuyNow] Variant after option click (shopify-context):', fromCtx);
        return;
      }

      // Fallback: shopify-store
      try {
        const store = document.querySelector('shopify-store') as any;
        const pd = store?.product || store?.__product || store?.state?.product;
        const v = pd?.selectedOrFirstAvailableVariant || pd?.selectedVariant;
        if (v?.id) {
          const id = extractNumericVariantId(v.id);
          if (id && id.length >= 8) {
            (window as any).selectedVariantId = id;
            console.log('[ShiprocketBuyNow] Variant after option click (shopify-store):', id);
          }
        }
      } catch (err) {
        console.warn('[ShiprocketBuyNow] Could not read store after click:', err);
      }
    }, 200);
  }, true);

  // ─── Listener 3: change event on radio buttons (capture phase) ───────────────
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) ||
        target.type !== 'radio' ||
        !target.name.includes('option-')) return;

    console.log('[ShiprocketBuyNow] Radio changed:', target.value);

    setTimeout(() => {
      const fromCtx = getVariantFromShopifyContext();
      if (fromCtx && fromCtx.length >= 8) {
        (window as any).selectedVariantId = fromCtx;
        console.log('[ShiprocketBuyNow] Variant after radio change (shopify-context):', fromCtx);
        return;
      }
      try {
        const store = document.querySelector('shopify-store') as any;
        const pd = store?.product || store?.__product || store?.state?.product;
        const v = pd?.selectedOrFirstAvailableVariant || pd?.selectedVariant;
        if (v?.id) {
          const id = extractNumericVariantId(v.id);
          if (id && id.length >= 8) {
            (window as any).selectedVariantId = id;
            console.log('[ShiprocketBuyNow] Variant after radio change (shopify-store):', id);
          }
        }
      } catch (err) { /* silent */ }
    }, 150);
  }, true);

  // ─── Observer: shopify-context[type="product"] MutationObserver ──────────────
  const setupContextObserver = (contexts: NodeListOf<Element>) => {
    console.log('[ShiprocketBuyNow] Attaching observer to', contexts.length, 'shopify-context element(s)');

    contexts.forEach((ctx) => {
      const observer = new MutationObserver(() => {
        const id = getVariantFromShopifyContext();
        if (id && id.length >= 8 && id !== (window as any).selectedVariantId) {
          (window as any).selectedVariantId = id;
          console.log('[ShiprocketBuyNow] Variant from shopify-context observer:', id);
        }
      });
      observer.observe(ctx, { attributes: true, subtree: true, childList: true });
    });

    // Capture any initially auto-selected variant
    const initial = getVariantFromShopifyContext();
    if (initial && initial.length >= 8) {
      (window as any).selectedVariantId = initial;
      console.log('[ShiprocketBuyNow] Initial variant from shopify-context:', initial);
    }
  };

  // ─── Observer: shopify-store MutationObserver (legacy) ───────────────────────
  const setupStoreObserver = (store: Element) => {
    console.log('[ShiprocketBuyNow] Attaching observer to shopify-store');

    const observer = new MutationObserver(() => {
      try {
        const pd = (store as any).product || (store as any).__product || (store as any).state?.product;
        const v = pd?.selectedOrFirstAvailableVariant || pd?.selectedVariant;
        if (v?.id) {
          const id = extractNumericVariantId(v.id);
          if (id && id !== (window as any).selectedVariantId) {
            (window as any).selectedVariantId = id;
            console.log('[ShiprocketBuyNow] Variant from shopify-store observer:', id);
          }
        }
      } catch (e) { /* silent */ }
    });

    observer.observe(store, { attributes: true, subtree: true, childList: true });

    // Check initial state
    try {
      const pd = (store as any).product || (store as any).__product || (store as any).state?.product;
      const v = pd?.selectedOrFirstAvailableVariant || pd?.selectedVariant;
      if (v?.id) {
        const id = extractNumericVariantId(v.id);
        if (id && !((window as any).selectedVariantId)) {
          (window as any).selectedVariantId = id;
          console.log('[ShiprocketBuyNow] Initial variant from shopify-store:', id);
        }
      }
    } catch (e) { /* silent */ }
  };

  // ─── Poll for shopify-context and shopify-store ───────────────────────────────
  let pollAttempts = 0;
  let contextFound = false;
  let storeFound = false;

  const pollInterval = setInterval(() => {
    pollAttempts++;

    if (!contextFound) {
      const contexts = document.querySelectorAll('shopify-context[type="product"]');
      if (contexts.length > 0) {
        contextFound = true;
        setupContextObserver(contexts);
      }
    }

    if (!storeFound) {
      const store = document.querySelector('shopify-store');
      if (store) {
        storeFound = true;
        setupStoreObserver(store);
      }
    }

    if ((contextFound && storeFound) || pollAttempts >= 50) {
      clearInterval(pollInterval);
      if (!contextFound) {
        console.warn('[ShiprocketBuyNow] shopify-context[type="product"] not found after 5s');
      }
    }
  }, 100);

  // ─── Debug helper ─────────────────────────────────────────────────────────────
  (window as any).debugVariantSelection = () => {
    console.group('[ShiprocketBuyNow] === Variant Selection Debug ===');
    console.log('shopify-store:', !!document.querySelector('shopify-store'));
    console.log('shopify-context[type=product]:', document.querySelectorAll('shopify-context[type="product"]').length);
    console.log('shopify-variant-selector:', !!document.querySelector('shopify-variant-selector'));
    console.log('selectedVariantId:', (window as any).selectedVariantId);
    console.log('Shiprocket ready:', !!(window as any).shiprocketCheckoutEvents);

    const fromCtx = getVariantFromShopifyContext();
    console.log('Variant from shopify-context NOW:', fromCtx);

    const radios = document.querySelectorAll('input[type="radio"]:checked');
    radios.forEach((r: any) => console.log('Checked radio:', r.name, r.value));

    console.log('Resolved variant ID:', getSelectedVariantId());
    console.groupEnd();
  };

  console.log('[ShiprocketBuyNow] Handler initialized');
}