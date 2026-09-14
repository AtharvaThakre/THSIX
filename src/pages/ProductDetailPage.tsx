import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import './ProductDetailPage.css';

// Fake review data
const fakeReviews = [
  {
    id: 1,
    name: "James Guide",
    rating: 5,
    date: "2024-01-15",
    comment: "A simple sneaker but makes the user seem neat and beautiful, the material is soft, but when I often emblaze because of sitting for too long",
    helpful: 6,
    avatar: "JG"
  },
  {
    id: 2,
    name: "Guy Hawkins",
    rating: 5,
    date: "2024-01-10", 
    comment: "Perfect fit and amazing quality. Love the design and comfort level.",
    helpful: 4,
    avatar: "GH"
  },
  {
    id: 3,
    name: "Sarah Chen",
    rating: 4,
    date: "2024-01-08",
    comment: "Great product overall, delivery was fast. Only minor issue with sizing.",
    helpful: 2,
    avatar: "SC"
  }
];

const fakeRatingBreakdown = {
  5: 184,
  4: 63,
  3: 29,
  2: 7,
  1: 2
};

export const ProductDetailPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const [activeTab, setActiveTab] = useState('reviews');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);
  
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
      <AnnouncementBar />
      <Header />

      <shopify-store
        store-domain="https://19sjnp-gx.myshopify.com"
        public-access-token="be59fa0cf086500d7b6456e64f233866"
        country="US"
        language="EN"
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
                    <div class="product-detail__images">
                      <div class="product-detail__main-image" id="main-image-display">
                        <shopify-media
                          width="600"
                          height="600"
                          query="product.featuredImage"
                          layout="constrained"
                          id="main-shopify-media"
                        ></shopify-media>
                      </div>
                      
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
                    </div>

                    <div class="product-detail__info">
                      <div class="product-detail__header">
                        <span class="product-detail__brand">THSIX</span>
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
                          <span class="product-detail__rating-text">${averageRating} (${totalReviews} reviews)</span>
                        </div>

                        <div class="product-detail__price">
                          <shopify-money
                            query="product.selectedOrFirstAvailableVariant.price"
                            format="money_with_currency"
                          ></shopify-money>
                        </div>
                      </div>

                      <div class="product-detail__description">
                        <p>A premium collection featuring this iconic design. This collection features superior craftsmanship and materials, perfect for the modern lifestyle. Made with high-quality materials and attention to detail.</p>
                        <p>Experience comfort and style with every step. Each piece is carefully crafted to deliver both performance and aesthetic appeal.</p>
                      </div>

                      <div class="product-detail__variants">
                        <shopify-variant-selector></shopify-variant-selector>
                      </div>

                      <div class="product-detail__actions">
                        <button
                          class="product-detail__add-btn"
                          onclick="document.getElementById('global-cart').addLine(event);"
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

                      <div class="product-detail__secondary-actions">
                        <button class="product-detail__action-btn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          <span>Chat</span>
                        </button>
                        <button class="product-detail__action-btn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 21-6-6 6-6 6 6-6 6z"/><path d="M12 3v12"/></svg>
                          <span>Wishlist</span>
                        </button>
                        <button class="product-detail__action-btn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `,
            }}
          />
        </shopify-context>

        <div className="product-detail__tabs">
          <div className="product-detail__container">
            <div className="product-detail__tab-nav">
              <button
                className={`product-detail__tab-btn ${activeTab === 'details' ? 'product-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`product-detail__tab-btn ${activeTab === 'reviews' ? 'product-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
              <button
                className={`product-detail__tab-btn ${activeTab === 'discussion' ? 'product-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('discussion')}
              >
                Discussion
              </button>
            </div>

            <div className="product-detail__tab-content">
              {activeTab === 'details' && (
                <div className="product-detail__details">
                  <h3>Product Details</h3>
                  <ul>
                    <li>Premium materials and construction</li>
                    <li>Comfortable fit for all-day wear</li>
                    <li>Durable design built to last</li>
                    <li>Available in multiple colors and sizes</li>
                    <li>Easy care instructions</li>
                  </ul>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="product-detail__reviews">
                  <div className="product-detail__rating-summary">
                    <div className="product-detail__rating-left">
                      <div className="product-detail__avg-rating">
                        <div className="product-detail__stars-large">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`product-detail__star-large ${
                                star <= Math.round(parseFloat(averageRating)) ? 'product-detail__star-large--filled' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <div className="product-detail__rating-number">{averageRating}</div>
                      </div>
                    </div>

                    <div className="product-detail__rating-breakdown">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="product-detail__rating-row">
                          <span className="product-detail__rating-label">{rating}</span>
                          <div className="product-detail__rating-bar">
                            <div
                              className="product-detail__rating-fill"
                              style={{
                                width: `${(fakeRatingBreakdown[rating as keyof typeof fakeRatingBreakdown] / totalReviews) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="product-detail__rating-count">
                            {fakeRatingBreakdown[rating as keyof typeof fakeRatingBreakdown]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="product-detail__reviews-list">
                    <h4>Reviews</h4>
                    <p className="product-detail__reviews-count">Showing {fakeReviews.length} of {totalReviews} reviews</p>
                    
                    {fakeReviews.map((review) => (
                      <div key={review.id} className="product-detail__review">
                        <div className="product-detail__review-header">
                          <div className="product-detail__reviewer">
                            <div className="product-detail__avatar">{review.avatar}</div>
                            <div className="product-detail__reviewer-info">
                              <span className="product-detail__reviewer-name">{review.name}</span>
                              <div className="product-detail__review-meta">
                                <div className="product-detail__review-stars">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={`product-detail__review-star ${
                                        star <= review.rating ? 'product-detail__review-star--filled' : ''
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="product-detail__review-date">{review.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="product-detail__review-text">{review.comment}</p>
                        <div className="product-detail__review-actions">
                          <button className="product-detail__review-btn">
                            👍 {review.helpful}
                          </button>
                          <button className="product-detail__review-btn">Reply</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="product-detail__discussion">
                  <h3>Discussion</h3>
                  <p>Start a conversation about this product! Ask questions, share experiences, and connect with other customers.</p>
                  <button className="product-detail__start-discussion">Start Discussion</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};


