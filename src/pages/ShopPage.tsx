import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Search } from 'lucide-react';
import { CartEnhancer } from '../components/CartEnhancer/CartEnhancer';
import './ShopPage.css';

const BRANDS = [
  'All Products',
  'Nike',
  'Puma',
  'Adidas',
  'New Balance',
  'ASICS',
  'Converse',
];

export const ShopPage = () => {
  const [selectedBrand, setSelectedBrand] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine query attribute for shopify-list-context
  let queryAttr = 'products';
  if (searchQuery.trim()) {
    queryAttr = searchQuery.trim();
  } else if (selectedBrand !== 'All Products') {
    queryAttr = `vendor:${selectedBrand}`;
  }

  return (
    <div className="shop-page">
      <CartEnhancer />

      {/* Cart */}
      <shopify-cart id="shop-cart" />

      {/* Product Detail Modal */}
      <dialog id="shop-product-modal" className="shop-modal">
        <shopify-context
          id="shop-modal-context"
          type="product"
          wait-for-update
        >
          <template
            dangerouslySetInnerHTML={{
              __html: `
              <div class="shop-modal__container">
                <button class="shop-modal__close" onclick="document.getElementById('shop-product-modal').close()">&#10005;</button>
                <div class="shop-modal__layout">
                  <div class="shop-modal__media">
                    <shopify-media width="480" height="480" query="product.selectedOrFirstAvailableVariant.image" layout="constrained"></shopify-media>
                  </div>
                  <div class="shop-modal__details">
                    <div class="shop-modal__header">
                      <span class="shop-modal__vendor"><shopify-data query="product.vendor"></shopify-data></span>
                      <h2 class="shop-modal__title"><shopify-data query="product.title"></shopify-data></h2>
                      <div class="shop-modal__price">
                        <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                      </div>
                    </div>
                    <shopify-variant-selector></shopify-variant-selector>
                    <div class="shop-modal__actions">
                      <button
                        class="shop-modal__add-btn"
                        onclick="document.getElementById('global-cart').addLine(event);"
                        shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
                      >
                        Add to Cart
                      </button>
                      <button
                        class="shop-modal__buy-btn"
                        onclick="document.querySelector('shopify-store').buyNow(event)"
                        shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
                      >
                        Buy Now
                      </button>
                    </div>
                    <div class="shop-modal__description">
                      <shopify-data query="product.descriptionHtml"></shopify-data>
                    </div>
                  </div>
                </div>
              </div>
            `,
            }}
          />
        </shopify-context>
      </dialog>

      {/* Main Wrapper */}
      <div className="shop-container">
        {/* Top Header Row */}
        <header className="shop-topbar">
          <div className="shop-topbar__left">
            <Link to="/" className="shop-topbar__back" aria-label="Back to home">
              <ArrowLeft size={20} strokeWidth={2} />
            </Link>
            <h1 className="shop-topbar__title">Products</h1>
          </div>

          <div className="shop-topbar__right">
            <div className="shop-search">
              <Search size={17} className="shop-search__icon" />
              <input
                type="text"
                className="shop-search__input"
                placeholder="Search product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="shop-topbar__cart-btn"
              aria-label="Open cart"
              onClick={() => {
                const cart = document.getElementById('shop-cart') as any;
                if (cart?.showModal) cart.showModal();
              }}
            >
              <ShoppingBag size={22} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Brand Tabs Bar */}
        <div className="shop-tabs">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              className={`shop-tab ${selectedBrand === brand ? 'shop-tab--active' : ''}`}
              onClick={() => setSelectedBrand(brand)}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <main className="shop-main">
          <shopify-list-context
            key={`${selectedBrand}-${searchQuery}`}
            id="shop-product-list"
            type="product"
            query={queryAttr}
            first={20}
          >
            <template
              dangerouslySetInnerHTML={{
                __html: `
                <div
                  class="shop-card"
                  onclick="document.getElementById('shop-modal-context').update(event); document.getElementById('shop-product-modal').showModal();"
                  role="button"
                  tabindex="0"
                >
                  <div class="shop-card__image-wrap">
                    <shopify-media
                      query="product.selectedOrFirstAvailableVariant.image"
                      layout="constrained"
                      width="320"
                      height="320"
                    ></shopify-media>
                  </div>
                  <div class="shop-card__content">
                    <h3 class="shop-card__title">
                      <shopify-data query="product.title"></shopify-data>
                    </h3>
                    <p class="shop-card__price">
                      <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                    </p>
                  </div>
                </div>
              `,
              }}
            />
          </shopify-list-context>

          {/* Pagination */}
          <div className="shop-pagination">
            <button
              id="shop-prev-btn"
              className="shop-pagination__btn"
              onClick={() => {
                const list = document.getElementById('shop-product-list') as any;
                if (list?.previousPage) list.previousPage();
              }}
            >
              ← Previous
            </button>
            <button
              id="shop-next-btn"
              className="shop-pagination__btn"
              onClick={() => {
                const list = document.getElementById('shop-product-list') as any;
                if (list?.nextPage) list.nextPage();
              }}
            >
              Next →
            </button>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="shop-footer">
      </footer>
    </div>
  );
};
