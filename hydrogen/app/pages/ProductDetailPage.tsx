import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Analytics } from '@shopify/hydrogen';
import type { ProductByHandleQuery } from 'storefrontapi.generated';
import { ArrowLeft } from 'lucide-react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { SizeChart } from '../components/SizeChart/SizeChart';
import { ProductDescription } from '../components/ProductDescription/ProductDescription';
import { useCart } from '../contexts/CartContext';
import { loadPickrrScript, warmUpPickrrScript } from '../utils/pickrr-loader';
import { waitForShiprocket, checkoutWithProducts } from '../services/shiprocket-checkout';
import { buildShopifySrcSet, transformShopifyImageUrl, PRODUCT_IMAGE_SIZES } from '../utils/shopify-image-transform';
import { trackViewContent, trackInitiateCheckout, trackCustomEvent } from '../utils/metaPixel';
import { trackGA4ViewItem, trackGA4BeginCheckout } from '../utils/ga4';
import { trackShopifyAddToCart } from '../utils/shopify-analytics';
import Faqs01 from '../components/ui/faqs-01';
import './ProductDetailPage.css';

// Rating summary shown on every product page (hardcoded, not real customer reviews)
const fakeRatingBreakdown = { 5: 14500, 4: 1430, 3: 244, 2: 103, 1: 44 };

// ─── Helper ──────────────────────────────────────────────────────────────────
function extractNumericVariantId(variantId: string): string {
  if (variantId.includes('ProductVariant/')) {
    return variantId.split('ProductVariant/').pop() || variantId;
  }
  const m = variantId.match(/\d{8,}/);
  return m ? m[0] : variantId;
}

// ─── Component ───────────────────────────────────────────────────────────────
type Product = NonNullable<ProductByHandleQuery['product']>;

/** Product data comes from the route loader (server-side); the route keys this by product id. */
export const ProductDetailPage = ({ product }: { product: Product | null }) => {
  const handle = product?.handle;
  const { addItem } = useCart();

  // UI state
  // Shoppers must pick their size; only a single-size product is pre-selected
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(() => {
    const only = product?.variants.edges.length === 1 ? product.variants.edges[0].node : null;
    return only?.availableForSale ? 0 : null;
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Derived
  const variants: any[] = product?.variants?.edges?.map((e: any) => e.node) ?? [];
  const images: any[] = product?.images?.edges?.map((e: any) => e.node) ?? [];
  const selectedVariant = selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;
  const displayPrice =
    selectedVariant?.price?.amount ??
    product?.priceRange?.minVariantPrice?.amount ??
    '0';
  const currencyCode =
    selectedVariant?.price?.currencyCode ??
    product?.priceRange?.minVariantPrice?.currencyCode ??
    'INR';

  // Reviews
  const totalReviews = Object.values(fakeRatingBreakdown).reduce((a, b) => a + b, 0);
  const averageRating = (
    (5 * fakeRatingBreakdown[5] + 4 * fakeRatingBreakdown[4] +
     3 * fakeRatingBreakdown[3] + 2 * fakeRatingBreakdown[2] +
     1 * fakeRatingBreakdown[1]) / totalReviews
  ).toFixed(1);

  const formatPrice = (amount: string, currency: string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(parseFloat(amount));

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { window.scrollTo(0, 0); }, [handle]);

  // Meta Pixel ViewContent + GA4 view_item (Shopify's product view is <Analytics.ProductView> below)
  useEffect(() => {
    if (!product) return;
    const firstVariant = product.variants.edges[0]?.node;
    const price = firstVariant?.price ? parseFloat(firstVariant.price.amount) : 0;
    trackViewContent({
      content_name: product.title,
      content_ids: [product.id],
      value: price,
    });
    trackGA4ViewItem({
      item_id: product.id,
      item_name: product.title,
      item_variant: firstVariant?.title || '',
      price,
      quantity: 1,
    });
  }, [product]);

  useEffect(() => {
    const handler = () => setIsSizeChartOpen(true);
    window.addEventListener('openSizeChart', handler);
    return () => window.removeEventListener('openSizeChart', handler);
  }, []);

  // Keyboard navigation for images
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && selectedImageIndex < images.length - 1) {
        setSelectedImageIndex(prev => prev + 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedImageIndex, images.length]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleVariantSelect = useCallback((index: number) => {
    if (!variants[index]?.availableForSale) return;
    setSelectedVariantIndex(index);
    setSizeError(false);
    const variant = variants[index];
    const numId = extractNumericVariantId(variant.id);
    console.log('[ProductDetailPage] Variant selected:', numId, variant.title);
    // Track size selection
    trackCustomEvent('SizeSelected', {
      content_name: product?.title,
      size: variant.title,
      variant_id: numId,
    });
    // Switch main image to variant image if it has one
    if (variant.image?.url) {
      const imgIdx = images.findIndex((img: any) => img.url === variant.image.url);
      if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
    }
  }, [variants, images, product]);

  const requireSize = () => {
    setSizeError(true);
    document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant) { requireSize(); return; }
    const numId = extractNumericVariantId(selectedVariant.id);
    const img = selectedVariant.image?.url ?? images[selectedImageIndex]?.url ?? '';
    addItem({
      id: `${handle ?? ''}-${numId}`,
      title: product?.title ?? '',
      price: parseFloat(selectedVariant.price.amount),
      image: img,
      variantId: numId,
      variantTitle: selectedVariant.title,
      handle: handle ?? '',
    });
    // trackAddToCart is also fired inside CartContext.addItem for Meta/GA4
    // Shopify ADD_TO_CART fires here where we have the full GIDs (Step 3)
    trackShopifyAddToCart(
      {
        productGid: product?.id || '',
        variantGid: selectedVariant.id || '',
        name: product?.title || '',
        variantName: selectedVariant.title || '',
        brand: product?.vendor || 'THSIX',
        price: selectedVariant.price?.amount || '0',
        quantity: 1,
      }
    );
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 2000);
  }, [selectedVariant, addItem, handle, product, images, selectedImageIndex]);

  const handleBuyNow = useCallback(async () => {
    if (!selectedVariant) { requireSize(); return; }
    if (isBuyingNow) return;
    setCheckoutError(null);
    const numId = extractNumericVariantId(selectedVariant.id);
    console.log('[ProductDetailPage] Buy Now:', numId, selectedVariant.title);
    setIsBuyingNow(true);
    trackInitiateCheckout({
      content_ids: [numId],
      num_items: 1,
      value: parseFloat(selectedVariant.price?.amount || '0'),
    });
    trackCustomEvent('BuyNowClicked', {
      content_name: product?.title,
      size: selectedVariant.title,
      variant_id: numId,
    });
    const itemPrice = parseFloat(selectedVariant.price?.amount || '0');
    trackGA4BeginCheckout(
      [{ item_id: numId, item_name: product?.title || '', item_variant: selectedVariant.title || '', price: itemPrice, quantity: 1 }],
      itemPrice
    );
    // Save checkout value so CheckoutSuccess can fire accurate purchase events.
    // localStorage persists through cross-origin payment-gateway redirects (sessionStorage does not).
    try {
      localStorage.setItem('thsix_checkout_value', JSON.stringify({
        value: itemPrice,
        currency: currencyCode,
        items: [{ item_id: numId, item_name: product?.title || '', item_variant: selectedVariant.title || '', price: itemPrice, quantity: 1 }],
      }));
    } catch { /* storage unavailable */ }

    try {
      await loadPickrrScript();
      const isReady = await waitForShiprocket(10000);
      if (!isReady) throw new Error('Checkout service is unavailable. Please refresh and try again.');
      await checkoutWithProducts([{ variantId: numId, quantity: 1 }]);
      setTimeout(() => setIsBuyingNow(false), 3000);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to initiate checkout. Please try again.');
      setIsBuyingNow(false);
    }
  }, [selectedVariant, isBuyingNow, product, currencyCode]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50 && selectedImageIndex < images.length - 1) setSelectedImageIndex(i => i + 1);
    else if (dist < -50 && selectedImageIndex > 0) setSelectedImageIndex(i => i - 1);
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, selectedImageIndex, images.length]);

  // Main display image follows the selected thumbnail. Picking a size jumps to that
  // size's photo (handleVariantSelect), but thumbnails must still be able to change it.
  const mainImageRaw = images[selectedImageIndex]?.url ?? selectedVariant?.image?.url ?? '';
  // The main image is half the viewport on desktop and full width on mobile, so the
  // browser picks 600/900/1200px for 1x-2x screens (sizes must match the CSS grid).
  const mainImageUrl = transformShopifyImageUrl(mainImageRaw, { width: 900 });
  const mainImageSrcSet = buildShopifySrcSet(mainImageRaw, [600, 900, 1200]);

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="product-detail">
        <AnnouncementBar />
        <Header />
        <main className="product-detail__main" style={{ padding: '4rem 24px', textAlign: 'center' }}>
          <h2>Product not found</h2>
          <Link to="/#shop" style={{ color: '#111', textDecoration: 'underline' }}>← Back to shop</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="product-detail">
      <AnnouncementBar />
      <Header />

      <main className="product-detail__main">
        {/* Breadcrumb */}
        <div className="product-detail__breadcrumb">
          <div className="product-detail__container">
            <Link to="/" className="product-detail__back-link">
              <ArrowLeft size={16} />
              <span>Home</span>
            </Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <a href="/#shop" className="product-detail__breadcrumb-link">Shop</a>
            <span className="product-detail__breadcrumb-sep">/</span>
            <span className="product-detail__breadcrumb-current">Product</span>
          </div>
        </div>

        {/* Product Layout */}
        <div className="product-detail__container">
          <div className="product-detail__layout">

            {/* ── Left: Images ── */}
            <div className="product-detail__images">
              <div className="product-detail__thumbnails-container">
                <div className="product-detail__thumbnails" id="thumbnails-container">
                  {images.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className={`product-detail__thumbnail${idx === selectedImageIndex ? ' product-detail__thumbnail--active' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={img.altText ?? `Product image ${idx + 1}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedImageIndex(idx)}
                    >
                      <img
                        src={transformShopifyImageUrl(img.url, { width: PRODUCT_IMAGE_SIZES.thumbnail })}
                        srcSet={buildShopifySrcSet(img.url, [PRODUCT_IMAGE_SIZES.thumbnail, PRODUCT_IMAGE_SIZES.thumbnailRetina])}
                        sizes="74px"
                        alt={img.altText ?? product.title}
                        width={74}
                        height={74}
                        // Thumbnails sit at the top of the page, so the first few load eagerly.
                        loading={idx < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="product-detail__main-image"
                id="main-image-display"
                onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
                onTouchMove={(e) => setTouchEnd(e.touches[0].clientX)}
                onTouchEnd={handleTouchEnd}
              >
                {mainImageUrl ? (
                  <img
                    id="main-shopify-media"
                    src={mainImageUrl}
                    srcSet={mainImageSrcSet}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={product.title}
                    // This is the page's LCP image: load it eagerly at high priority.
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Product Info ── */}
            <div className="product-detail__info">
              <div className="product-detail__header">
                {product.vendor && (
                  <span className="product-detail__brand">{product.vendor}</span>
                )}
                <h1 className="product-detail__title">{product.title}</h1>

                <div className="product-detail__rating">
                  <div className="product-detail__stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                  <span className="product-detail__rating-text">{averageRating} · {totalReviews.toLocaleString()} reviews</span>
                </div>

                <div className="product-detail__price">
                  {formatPrice(displayPrice, currencyCode)}
                </div>
              </div>

              {/* Size Selector */}
              <div className="product-detail__variants" id="size-picker">
                <div className="product-detail__size-selector">
                  <div className="product-detail__size-header">
                    <span className="product-detail__size-label">SELECT YOUR SIZE</span>
                    <button
                      className="product-detail__size-chart-btn"
                      onClick={() => { setIsSizeChartOpen(true); trackCustomEvent('SizeChartOpened', { content_name: product?.title }); }}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                      </svg>
                      Size chart
                    </button>
                  </div>

                  <div className="product-detail__size-options">
                    {variants.map((variant: any, idx: number) => (
                      <button
                        key={variant.id}
                        type="button"
                        className={[
                          'product-detail__size-btn',
                          selectedVariantIndex === idx ? 'product-detail__size-btn--selected' : '',
                          !variant.availableForSale ? 'product-detail__size-btn--unavailable' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleVariantSelect(idx)}
                        disabled={!variant.availableForSale}
                        aria-pressed={selectedVariantIndex === idx}
                        aria-label={`Size ${variant.title}${!variant.availableForSale ? ' (sold out)' : ''}`}
                      >
                        {variant.title}
                      </button>
                    ))}
                  </div>

                  {sizeError && (
                    <p className="product-detail__size-error">
                      Please select a size to continue.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="product-detail__actions">
                <button
                  className="product-detail__add-btn"
                  type="button"
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? 'Added ✓' : 'Add to Cart'}
                </button>
                <button
                  className="product-detail__buy-btn"
                  type="button"
                  onPointerEnter={warmUpPickrrScript}
                  onFocus={warmUpPickrrScript}
                  onClick={() => void handleBuyNow()}
                  disabled={isBuyingNow}
                >
                  {isBuyingNow ? 'Loading...' : 'Buy Now'}
                </button>
              </div>
              {checkoutError && (
                <p className="product-detail__size-error" role="alert">{checkoutError}</p>
              )}

              {/* Delivery & Authentication */}
              <div className="product-detail__section">
                <h3 className="product-detail__section-title">Delivery and Authentication</h3>
                <div className="product-detail__info-grid">
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">Fulfilled by THSIX</span>
                      <p className="product-detail__info-text">Sourced verified seller</p>
                    </div>
                  </div>
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">THSIX verified Product</span>
                      <p className="product-detail__info-text">Hand picked</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop with Confidence */}
              <div className="product-detail__section">
                <h3 className="product-detail__section-title">Shop with Confidence</h3>
                <div className="product-detail__info-grid">
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">Cash on delivery available</span>
                    </div>
                  </div>
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">Priority support via WhatsApp</span>
                    </div>
                  </div>
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">Insured Delivery promise</span>
                    </div>
                  </div>
                  <div className="product-detail__info-item">
                    <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div className="product-detail__info-content">
                      <span className="product-detail__info-label">Easy Exchange policy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="product-detail__container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div className="product-detail__description-section">
            <h2 className="product-detail__description-heading">Product Description</h2>
            <div className="product-detail__description-wrapper">
              <ProductDescription html={product.descriptionHtml ?? ''} />
            </div>
          </div>
        </div>

        <div className="product-detail__container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <Faqs01 />
        </div>
      </main>

      <Footer />
      <SizeChart isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: variants[0]?.price?.amount ?? '0',
              vendor: product.vendor || 'THSIX',
              variantId: variants[0]?.id ?? '',
              variantTitle: variants[0]?.title ?? '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
};