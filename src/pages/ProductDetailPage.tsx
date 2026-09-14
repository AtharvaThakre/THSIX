import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { ProductReviews } from '../components/ProductReviews/ProductReviews';
import { CartEnhancer } from '../components/CartEnhancer/CartEnhancer';
import { SizeChart } from '../components/SizeChart/SizeChart';
import { forceLoadAllVariants, refreshProductData } from '../utils/shopifyVariantLoader';
import Faqs01 from '../components/ui/faqs-01';
import './ProductDetailPage.css';

// Fake review data with images
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

const fakeRatingBreakdown = {
  5: 14500,
  4: 1430,
  3: 244,
  2: 103,
  1: 44
};

export const ProductDetailPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalReviews = Object.values(fakeRatingBreakdown).reduce((a, b) => a + b, 0);
  const averageRating = (
    (5 * fakeRatingBreakdown[5] + 4 * fakeRatingBreakdown[4] + 3 * fakeRatingBreakdown[3] + 2 * fakeRatingBreakdown[2] + 1 * fakeRatingBreakdown[1]) / totalReviews
  ).toFixed(1);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [handle]);

  // Listen for size chart open event
  useEffect(() => {
    const handleOpenSizeChart = () => {
      setIsSizeChartOpen(true);
    };

    window.addEventListener('openSizeChart', handleOpenSizeChart);

    return () => {
      window.removeEventListener('openSizeChart', handleOpenSizeChart);
    };
  }, []);

  // Force load all product variants
  useEffect(() => {
    const ensureAllVariantsLoaded = async () => {
      if (handle) {
        // Try to refresh product data first
        await refreshProductData(handle);
      }
      
      // Force load all variants
      const cleanup = forceLoadAllVariants();
      
      // Clean up after a delay
      setTimeout(cleanup, 10000);
    };

    ensureAllVariantsLoaded();
  }, [handle]);

  // Initialize gallery and sync thumbnails with main image
  useEffect(() => {
    const updateMainImageFromThumbnail = (thumbnail: HTMLElement, index?: number) => {
      let sourceImg = thumbnail.querySelector('img') as HTMLImageElement | null;
      if (!sourceImg) {
        const media = thumbnail.querySelector('shopify-media');
        if (media) {
          sourceImg = (media.querySelector('img') || media.shadowRoot?.querySelector('img')) as HTMLImageElement | null;
        }
      }

      const rawSrc = sourceImg?.currentSrc || sourceImg?.src || sourceImg?.getAttribute('src');
      if (!rawSrc) return;

      // Active state styling
      document.querySelectorAll('.product-detail__thumbnail').forEach(t => t.classList.remove('product-detail__thumbnail--active'));
      thumbnail.classList.add('product-detail__thumbnail--active');

      // Main image container & img element
      const mainMedia = document.querySelector('#main-shopify-media');
      if (!mainMedia) return;

      let mainImg = mainMedia.querySelector('img') as HTMLImageElement | null;
      if (!mainImg && mainMedia.shadowRoot) {
        mainImg = mainMedia.shadowRoot.querySelector('img') as HTMLImageElement | null;
      }

      if (mainImg) {
        // Generate high resolution image URL
        let fullSizeUrl = rawSrc
          .replace(/([?&])(width|height|w|h)=\d+/gi, '')
          .replace(/\?&/g, '?')
          .replace(/[\?&]$/, '');

        fullSizeUrl += (fullSizeUrl.includes('?') ? '&' : '?') + 'width=800&height=800';

        // Clear srcset so browser is forced to render the new src
        mainImg.removeAttribute('srcset');
        mainImg.srcset = '';
        mainImg.src = fullSizeUrl;
        mainImg.style.opacity = '1';
      }

      if (typeof index === 'number') {
        setSelectedImageIndex(index);
      }

      thumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    };

    // Global event delegation for thumbnail clicks
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const thumbnail = target.closest('.product-detail__thumbnail') as HTMLElement;
      if (thumbnail) {
        const thumbnails = Array.from(document.querySelectorAll<HTMLElement>('.product-detail__thumbnail'));
        const idx = thumbnails.indexOf(thumbnail);
        updateMainImageFromThumbnail(thumbnail, idx >= 0 ? idx : undefined);
      }
    };

    document.addEventListener('click', handleGlobalClick);

    // Initial check for total images and first active thumbnail
    const checkInterval = setInterval(() => {
      const thumbnails = document.querySelectorAll<HTMLElement>('.product-detail__thumbnail');
      if (thumbnails.length > 0) {
        setTotalImages(thumbnails.length);
        if (!document.querySelector('.product-detail__thumbnail--active')) {
          thumbnails[0].classList.add('product-detail__thumbnail--active');
        }
      }
    }, 300);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const thumbnails = document.querySelectorAll<HTMLElement>('.product-detail__thumbnail');
      if (thumbnails.length === 0) return;

      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        const prevThumbnail = thumbnails[selectedImageIndex - 1];
        if (prevThumbnail) {
          updateMainImageFromThumbnail(prevThumbnail, selectedImageIndex - 1);
        }
      } else if (e.key === 'ArrowRight' && selectedImageIndex < totalImages - 1) {
        const nextThumbnail = thumbnails[selectedImageIndex + 1];
        if (nextThumbnail) {
          updateMainImageFromThumbnail(nextThumbnail, selectedImageIndex + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Touch swipe handler
    const mainImageDisplay = document.getElementById('main-image-display');
    if (mainImageDisplay) {
      const handleTouchStart = (e: TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
      };

      const handleTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.touches[0].clientX);
      };

      const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const thumbnails = document.querySelectorAll<HTMLElement>('.product-detail__thumbnail');

        if (distance > 50 && selectedImageIndex < totalImages - 1) {
          const nextThumbnail = thumbnails[selectedImageIndex + 1];
          if (nextThumbnail) updateMainImageFromThumbnail(nextThumbnail, selectedImageIndex + 1);
        } else if (distance < -50 && selectedImageIndex > 0) {
          const prevThumbnail = thumbnails[selectedImageIndex - 1];
          if (prevThumbnail) updateMainImageFromThumbnail(prevThumbnail, selectedImageIndex - 1);
        }
      };

      mainImageDisplay.addEventListener('touchstart', handleTouchStart, false);
      mainImageDisplay.addEventListener('touchmove', handleTouchMove, false);
      mainImageDisplay.addEventListener('touchend', handleTouchEnd, false);

      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('keydown', handleKeyDown);
        mainImageDisplay.removeEventListener('touchstart', handleTouchStart);
        mainImageDisplay.removeEventListener('touchmove', handleTouchMove);
        mainImageDisplay.removeEventListener('touchend', handleTouchEnd);
        clearInterval(checkInterval);
      };
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(checkInterval);
    };
  }, [selectedImageIndex, totalImages, touchStart, touchEnd]);

  return (
    <div className="product-detail">
      <CartEnhancer />
      <AnnouncementBar />
      <Header />

      <shopify-store
        store-domain={import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "https://19sjnp-gx.myshopify.com"}
        public-access-token={import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "be59fa0cf086500d7b6456e64f233866"}
        country="US"
        language="EN"
        include-all-variants="true"
      />

      <shopify-cart id="product-cart" />

      <main className="product-detail__main">
        <div className="product-detail__breadcrumb">
          <div className="product-detail__container">
            <Link to="/" className="product-detail__back-link">
              <ArrowLeft size={18} />
              <span>Home</span>
            </Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <Link to="/shop" className="product-detail__breadcrumb-link">Shop</Link>
            <span className="product-detail__breadcrumb-sep">/</span>
            <span className="product-detail__breadcrumb-current">Product</span>
          </div>
        </div>

        <shopify-context type="product" handle={handle || 'default-product'}>
          <template
            dangerouslySetInnerHTML={{
              __html: `
                <div class="product-detail__container">
                  <div class="product-detail__layout">
                    <!-- Left side: Sticky Images -->
                    <div class="product-detail__images">
                      <div class="product-detail__thumbnails-container">
                        <div class="product-detail__thumbnails" id="thumbnails-container">
                          <shopify-list-context 
                            type="image" 
                            query="product.images"
                            first="10"
                          >
                            <template>
                              <div class="product-detail__thumbnail" role="button" tabindex="0" aria-label="Product image">
                                <shopify-media
                                  width="80"
                                  height="80"
                                  query="image"
                                  layout="constrained"
                                ></shopify-media>
                              </div>
                            </template>
                          </shopify-list-context>
                        </div>
                      </div>
                      
                      <div class="product-detail__main-image" id="main-image-display">
                        <shopify-media
                          width="600"
                          height="600"
                          query="product.featuredImage"
                          layout="constrained"
                          id="main-shopify-media"
                        ></shopify-media>
                      </div>
                    </div>

                    <!-- Right side: Scrollable Info -->
                    <div class="product-detail__info">
                      <div class="product-detail__header">
                        <span class="product-detail__brand">
                          <shopify-data query="product.vendor"></shopify-data>
                        </span>
                        <h1 class="product-detail__title">
                          <shopify-data query="product.title"></shopify-data>
                        </h1>
                        
                        <div class="product-detail__rating">
                          <div class="product-detail__stars">
                            <svg class="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                            <svg class="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                            <svg class="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                            <svg class="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                            <svg class="product-detail__star product-detail__star--filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                          </div>
                          <span class="product-detail__rating-text">${averageRating} · ${totalReviews} reviews</span>
                        </div>

                        <div class="product-detail__price">
                          <shopify-money
                            query="product.selectedOrFirstAvailableVariant.price"
                            format="money_with_currency"
                          ></shopify-money>
                        </div>
                      </div>

                      <div class="product-detail__variants">
                        <div class="product-detail__size-selector">
                          <div class="product-detail__size-header">
                            <label class="product-detail__size-label">SELECT YOUR SIZE</label>
                            <button 
                              class="product-detail__size-chart-btn" 
                              onclick="window.dispatchEvent(new CustomEvent('openSizeChart'))"
                              type="button"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
                              </svg>
                              Size chart
                            </button>
                          </div>
                          <shopify-variant-selector 
                            include-unavailable="true"
                            show-unavailable="true"
                            show-sold-out="true"
                            show-price="false"
                            auto-select="first-available"
                            variant-style="button"
                            size-first="true"
                          ></shopify-variant-selector>
                        </div>
                      </div>

                      <div class="product-detail__actions">
                        <button
                          class="product-detail__add-btn"
                          onclick="document.getElementById('product-cart').addLine(event);"
                          shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
                        >
                          Add to Cart
                        </button>
                        <button
                          class="product-detail__buy-btn"
                          onclick="document.querySelector('shopify-store').buyNow(event)"
                          shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
                        >
                          Buy Now
                        </button>
                      </div>

                      <div class="product-detail__section">
                        <h3 class="product-detail__section-title">Delivery and Authentication</h3>
                        <div class="product-detail__info-grid">
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Fulfilled by HeatStreet</span>
                              <p class="product-detail__info-text">Sourced verified seller</p>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Includes Authentication Certificate</span>
                              <p class="product-detail__info-text">by Checkcheck global standards</p>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Ships Today: XpresShip</span>
                              <p class="product-detail__info-text">Pre-authenticated · Free delivery with standard timelines</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="product-detail__section">
                        <h3 class="product-detail__section-title">Shop with Confidence</h3>
                        <div class="product-detail__info-grid">
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Cash on delivery available</span>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Priority support via WhatsApp</span>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Buyer Protection policy</span>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Insured Delivery promise</span>
                            </div>
                          </div>
                          <div class="product-detail__info-item">
                            <svg class="product-detail__info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            <div class="product-detail__info-content">
                              <span class="product-detail__info-label">Easy Exchange policy</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="product-detail__section">
                        <h3 class="product-detail__section-title">Product Description</h3>
                        <div class="product-detail__description-content" style="color: #666; line-height: 1.7; font-size: 14px;">
                          <shopify-data query="product.description"></shopify-data>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `,
            }}
          />
        </shopify-context>

        {/* Reviews Section */}
        <div className="product-detail__container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <ProductReviews
            reviews={fakeReviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
            ratingBreakdown={fakeRatingBreakdown}
          />

          {/* FAQ Section */}
          <Faqs01 />
        </div>
      </main>

      <Footer />
      
      {/* Size Chart Modal */}
      <SizeChart isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
    </div>
  );
};


