import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { brandsData } from '../data/brands';
import { fetchShopifyCollection, convertShopifyProductFromCollection } from '../services/shopify-collections';
import './BrandCollectionPage.css';

interface Collection {
  id: string;
  title: string;
  handle: string;
  image: {
    url: string;
    altText: string | null;
  } | null;
  description: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  image: {
    src: string | null;
  };
  variants: {
    id: string;
    title: string;
    price: string;
    compare_at_price?: string | null;
    option_values: {
      [key: string]: string;
    };
  }[];
  available: boolean;
  priceRange: {
    min: number;
    currency: string;
  };
  compareAtPriceRange?: {
    min: number;
    currency: string;
  } | null;
}

export function BrandCollectionPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brand = brandsData.find(b => b.id === brandId);

  useEffect(() => {
    if (!brandId) return;

    const fetchCollectionData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if Shopify is properly configured
        if (!import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || !import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
          console.warn('Shopify environment variables not configured, using fallback data');
          throw new Error('Shopify configuration missing. Please check environment variables.');
        }

        // Map brand ID to Shopify collection handle
        let collectionHandle = brandId.toLowerCase();
        
        // Handle specific brand mappings based on your Shopify setup
        if (brandId === 'adidas') {
          collectionHandle = 'frontpage'; // Based on your Shopify collection handle
        }

        console.log('Fetching collection:', collectionHandle);
        
        // Fetch collection and products from Shopify
        const shopifyCollection = await fetchShopifyCollection(collectionHandle);

        if (!shopifyCollection) {
          throw new Error(`Collection "${collectionHandle}" not found in Shopify`);
        }

        // Set collection data
        setCollection({
          id: shopifyCollection.id,
          title: shopifyCollection.title,
          handle: shopifyCollection.handle,
          image: shopifyCollection.image,
          description: shopifyCollection.description
        });

        // Convert and set products
        const convertedProducts = shopifyCollection.products.edges.map(edge => 
          convertShopifyProductFromCollection(edge.node)
        );

        console.log('Fetched products:', convertedProducts);
        setProducts(convertedProducts);

      } catch (err) {
        console.error('Error fetching collection:', err);
        
        // Fallback to mock data for development if Shopify fails
        if (brandId === 'adidas') {
          console.log('Using fallback data for Adidas collection');
          setCollection({
            id: 'adidas-fallback',
            title: 'ADIDAS Collection',
            handle: 'adidas',
            image: null,
            description: 'Explore our curated collection of Adidas sneakers and sportswear. From the iconic Samba OG to the classic Gazelle, discover timeless designs that blend heritage with modern style.'
          });

          setProducts([
            {
              id: 'samba-fallback-1',
              title: 'Samba Deep Indigo Cream',
              handle: 'samba-deep-indigo-cream',
              description: 'The iconic Adidas Samba in Deep Indigo and Cream colorway.',
              vendor: 'Adidas',
              image: { src: '/assets/products/adidas.png' },
              variants: [{
                id: 'var-1',
                title: 'Deep Indigo / Cream',
                price: '10999.00',
                compare_at_price: null,
                option_values: { Color: 'Deep Indigo / Cream', Size: '9' }
              }],
              available: true,
              priceRange: { min: 10999, currency: 'INR' }
            },
            {
              id: 'samba-fallback-2',
              title: 'Samba Onyx Ivory Gum',
              handle: 'samba-onyx-ivory-gum',
              description: 'The iconic Adidas Samba in Onyx, Ivory and Gum colorway.',
              vendor: 'Adidas',
              image: { src: '/assets/products/adidas.png' },
              variants: [{
                id: 'var-2',
                title: 'Onyx / Ivory / Gum',
                price: '10999.00',
                compare_at_price: null,
                option_values: { Color: 'Onyx / Ivory / Gum', Size: '9' }
              }],
              available: true,
              priceRange: { min: 10999, currency: 'INR' }
            },
            {
              id: 'samba-fallback-3',
              title: 'Samba Evergreen Vanilla Gum',
              handle: 'samba-evergreen-vanilla-gum',
              description: 'The iconic Adidas Samba in Evergreen, Vanilla and Gum colorway.',
              vendor: 'Adidas',
              image: { src: '/assets/products/adidas.png' },
              variants: [{
                id: 'var-3',
                title: 'Evergreen / Vanilla / Gum',
                price: '10999.00',
                compare_at_price: '12999.00',
                option_values: { Color: 'Evergreen / Vanilla / Gum', Size: '9' }
              }],
              available: true,
              priceRange: { min: 10999, currency: 'INR' }
            }
          ]);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load collection');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [brandId]);

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹ ${numPrice.toLocaleString('en-IN')}`;
  };

  const formatComparePrice = (comparePrice?: string | null): string | null => {
    if (!comparePrice) return null;
    const numPrice = parseFloat(comparePrice);
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
            <div className="brand-collection__logo">
              <img
                src={brand.logo || '/assets/logos/default-brand.png'}
                alt={`${brand.name} Logo`}
                className="brand-collection__logo-image"
              />
            </div>
            <h1 className="brand-collection__title">{brand.name} Collection</h1>
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
            {loading && (
              <div className="brand-collection__loading">
                <div className="loading-spinner"></div>
                <p>Loading products from Shopify...</p>
              </div>
            )}

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

            {!loading && !error && products.length === 0 && (
              <div className="brand-collection__empty">
                <p>No products available in this collection yet.</p>
                <p>Check back soon for new arrivals!</p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="products-grid">
                {products.map((product) => (
                  <a 
                    key={product.id}
                    className="product-card__link" 
                    href={`/product/${product.handle}`}
                    data-product-handle={product.handle}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/product/${product.handle}`;
                    }}
                  >
                    <div className="product-card__image-container">
                      <img
                        className="product-card__image"
                        src={product.image?.src || '/assets/products/adidas.png'}
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
                        {product.variants.length > 0 && (
                          <p className="product-card__price">
                            {formatPrice(product.variants[0].price)}
                          </p>
                        )}
                      </div>
                      <button 
                        className="product-card__action" 
                        aria-label="Quick add to cart"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // TODO: Implement add to cart functionality
                          console.log('Add to cart:', product);
                        }}
                        disabled={!product.available}
                      >
                        <div className="cart-btn-icon">
                          <svg className="cart-btn-icon__bag" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                          </svg>
                          <svg className="cart-btn-icon__check" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <span className="cart-btn-text"></span>
                      </button>
                    </div>
                  </a>
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