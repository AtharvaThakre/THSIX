import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { ProductReviews } from '../components/ProductReviews/ProductReviews';
import { SizeChart } from '../components/SizeChart/SizeChart';
import { ProductDescription } from '../components/ProductDescription/ProductDescription';
import { fetchShopifyProductByHandle } from '../services/shopify-products';
import { useCart } from '../contexts/CartContext';
import { loadPickrrScript } from '../utils/pickrr-loader';
import { waitForShiprocket, checkoutWithProducts } from '../services/shiprocket-checkout';
import Faqs01 from '../components/ui/faqs-01';
import './ProductDetailPage.css';

// ─── Fake review data ────────────────────────────────────────────────────────
const fakeReviews = [
  {
    id: 1,
    name: "ShellyBel",
    rating: 5,
    date: "3 months ago",
    comment: "I Was Blown Away By The Shoe When I First Tried It On. I Honestly Thought That It Would Cost More Than What I Paid $$$ It. I Fit Size 9 For My Running, I Was...",
    helpful: 6,
    avatar: "SB",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop",
    ]
  },
  {
    id: 2,
    name: "Hochanger",
    rating: 5,
    date: "7 months ago",
    comment: "I Got The Similar Product On They Are In My Then. They Are Very Light And Super Comfy. There's Lots Of Bounce For Energy Return As Proper Runners Like To Call It. Which Makes Upend The Pace Easier...",
    helpful: 4,
    avatar: "H",
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
    ]
  },
];

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
export const ProductDetailPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const { addItem } = useCart();

  // Product data
  const [product, setProduct] = useState<any>(null);
  const [productLoading, setProductLoading] = useState(true);

  // UI state
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
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

  useEffect(() => {
    if (!handle) return;
    setProductLoading(true);
    setProduct(null);
    setSelectedVariantIndex(null);
    setSelectedImageIndex(0);

    console.log('Fetching product for handle:', handle);
    fetchShopifyProductByHandle(handle)
      .then((p) => {
        if (p) {
          console.log('Product fetched:', p.title, '| variants:', p.variants?.edges?.length);
          setProduct(p);
          // Auto-select first available variant
          const vs: any[] = p.variants?.edges?.map((e: any) => e.node) ?? [];
          const firstAvailIdx = vs.findIndex((v: any) => v.availableForSale);
          const autoIdx = firstAvailIdx >= 0 ? firstAvailIdx : vs.length > 0 ? 0 : null;
          if (autoIdx !== null) setSelectedVariantIndex(autoIdx);
        } else {
          console.log('Product not found for handle:', handle);
        }
      })
      .catch((err) => console.error('Error fetching product:', err))
      .finally(() => setProductLoading(false));
  }, [handle]);

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
    // Switch main image to variant image if it has one
    if (variant.image?.url) {
      const imgIdx = images.findIndex((img: any) => img.url === variant.image.url);
      if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
    }
  }, [variants, images]);

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant) { setSizeError(true); return; }
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
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 2000);
  }, [selectedVariant, addItem, handle, product, images, selectedImageIndex]);

  const handleBuyNow = useCallback(async () => {
    if (!selectedVariant) { setSizeError(true); return; }
    if (isBuyingNow) return;
    setCheckoutError(null);
    const numId = extractNumericVariantId(selectedVariant.id);
    console.log('[ProductDetailPage] Buy Now:', numId, selectedVariant.title);
    setIsBuyingNow(true);
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
  }, [selectedVariant, isBuyingNow]);

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
  const mainImageUrl =
    images[selectedImageIndex]?.url ??
    selectedVariant?.image?.url ??
    '';

  // ── Render ───────────────────────────────────────────────────────────────────
  if (productLoading) {
    return (
      <div className="product-detail">
        <AnnouncementBar />
        <Header />
        <main className="product-detail__main">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="product-detail__loading-spinner" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <AnnouncementBar />
        <Header />
        <main className="product-detail__main" style={{ padding: '4rem 24px', textAlign: 'center' }}>
          <h2>Product not found</h2>
          <Link to="/shop" style={{ color: '#111', textDecoration: 'underline' }}>← Back to shop</Link>
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
              <ArrowLeft size={18} />
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
                        src={img.url}
                        alt={img.altText ?? product.title}
                        width={80}
                        height={80}
                        loading="lazy"
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
                    alt={product.title}
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
              <div className="product-detail__variants">
                <div className="product-detail__size-selector">
                  <div className="product-detail__size-header">
                    <label className="product-detail__size-label">SELECT YOUR SIZE</label>
                    <button
                      className="product-detail__size-chart-btn"
                      onClick={() => setIsSizeChartOpen(true)}
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
                  onClick={handleBuyNow}
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
                    <a href="https://wa.me/919022771696?text=Hi%20THSIX!" target="_blank" rel="noopener noreferrer" className="product-detail__whatsapp-link">
                      <svg className="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <div className="product-detail__info-content">
                        <span className="product-detail__info-label">Priority support via WhatsApp</span>
                      </div>
                    </a>
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

        {/* Reviews */}
        <div className="product-detail__container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <ProductReviews
            reviews={fakeReviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
            ratingBreakdown={fakeRatingBreakdown}
          />
          <Faqs01 />
        </div>
      </main>

      <Footer />
      <SizeChart isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
    </div>
  );
};