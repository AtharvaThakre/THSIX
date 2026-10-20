import { Link } from 'react-router';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import type { Brand } from '../types/brand';
import './BrandCollectionPage.css';

export interface BrandCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface BrandProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  image: string | null;
  price: string | null;
}

interface BrandCollectionPageProps {
  brand: Brand | null;
  collection: BrandCollection | null;
  products: BrandProduct[];
  error: string | null;
}

/** Brand collection page. Data is loaded server-side by routes/brands.$brandId.tsx. */
export function BrandCollectionPage({ brand, collection, products, error }: BrandCollectionPageProps) {
  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹ ${numPrice.toLocaleString('en-IN')}`;
  };

  if (!brand) {
    return (
      <div className="brand-not-found">
        <AnnouncementBar />
        <Header />
        <main className="brand-not-found__main">
          <h1>Brand Not Found</h1>
          <p>The requested brand could not be found.</p>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="brand-collection">
        {/* Brand Header Section */}
        <section className="brand-collection__header">
          <div className="container">
            <h1 className="brand-collection__title">Collections</h1>
            {collection && collection.description && (
              <div className="brand-collection__description">
                <p>{collection.description}</p>
              </div>
            )}
          </div>
        </section>

        {/* Products Grid Section */}
        <section className="brand-collection__products">
          <div className="container">
            {error && (
              <div className="brand-collection__error">
                <p>Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}

            {!error && products.length === 0 && (
              <div className="brand-collection__empty">
                <p>No products available in this collection yet.</p>
                <p>Check back soon for new arrivals!</p>
              </div>
            )}

            {!error && products.length > 0 && (
              <div className="products-grid">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    className="product-card__link"
                    to={`/product/${product.handle}`}
                    data-product-handle={product.handle}
                    prefetch="intent"
                  >
                    <div className="product-card__image-container">
                      <img
                        className="product-card__image"
                        src={product.image || '/assets/products/adidas.png'}
                        alt={product.title}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="product-card__info">
                      <div className="product-card__details">
                        <h3 className="product-card__title">
                          {product.title}
                        </h3>
                        <p className="product-card__color">
                          {product.vendor}
                        </p>
                        {product.price && (
                          <p className="product-card__price">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
