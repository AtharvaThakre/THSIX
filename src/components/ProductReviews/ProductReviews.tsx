import { Star } from 'lucide-react';
import './ProductReviews.css';

interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  avatar: string;
  images?: string[];
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: string;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const ProductReviews = ({ 
  reviews, 
  averageRating, 
  totalReviews, 
  ratingBreakdown 
}: ProductReviewsProps) => {
  return (
    <div className="product-reviews">
      <div className="product-reviews__header">
        <h3 className="product-reviews__title">Let's Hear It</h3>
        <h2 className="product-reviews__subtitle">From the SIX</h2>
      </div>

      <div className="product-reviews__summary">
        <div className="product-reviews__rating-left">
          <div className="product-reviews__avg-rating">
            <div className="product-reviews__rating-number">{averageRating}</div>
            <div className="product-reviews__stars-large">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`product-reviews__star-large ${
                    star <= Math.round(parseFloat(averageRating)) ? 'product-reviews__star-large--filled' : ''
                  }`}
                />
              ))}
            </div>
            <p className="product-reviews__rating-count">{totalReviews.toLocaleString()}+ REVIEWS</p>
          </div>
        </div>

        <div className="product-reviews__rating-breakdown">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="product-reviews__rating-row">
              <span className="product-reviews__rating-label">{rating}</span>
              <div className="product-reviews__rating-bar">
                <div
                  className="product-reviews__rating-fill"
                  style={{
                    width: `${(ratingBreakdown[rating as keyof typeof ratingBreakdown] / totalReviews) * 100}%`
                  }}
                ></div>
              </div>
              <span className="product-reviews__rating-stat">
                {ratingBreakdown[rating as keyof typeof ratingBreakdown]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="product-reviews__list">
        {reviews.map((review) => (
          <div key={review.id} className="product-reviews__review">
            <div className="product-reviews__review-header">
              <div className="product-reviews__reviewer">
                <div className="product-reviews__avatar">{review.avatar}</div>
                <div className="product-reviews__reviewer-info">
                  <span className="product-reviews__reviewer-name">{review.name}</span>
                  <div className="product-reviews__review-meta">
                    <div className="product-reviews__review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={`product-reviews__review-star ${
                            star <= review.rating ? 'product-reviews__review-star--filled' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <span className="product-reviews__review-date">{review.date}</span>
            </div>
            
            {review.images && review.images.length > 0 && (
              <div className="product-reviews__review-images">
                {review.images.map((img, idx) => (
                  <div key={idx} className="product-reviews__review-image">
                    <img src={img} alt={`Review ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
            
            <p className="product-reviews__review-text">{review.comment}</p>
            
            <div className="product-reviews__review-footer">
              <span className="product-reviews__review-source">Reviewed On adidas.co.uk</span>
              <button className="product-reviews__review-helpful">
                👍 {review.helpful}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="product-reviews__view-all">
        View All Reviews
      </button>
    </div>
  );
};
