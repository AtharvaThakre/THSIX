import { useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { extractPriceFromPage, waitForPrice } from '../../utils/priceExtractor';

export const CartEnhancer = () => {
  const { addItem } = useCart();

  useEffect(() => {
    const enhanceAddToCartButtons = () => {
      // Find all add to cart buttons
      const addToCartButtons = document.querySelectorAll<HTMLButtonElement>(
        '.product-detail__add-btn, .shop-modal__add-btn, .product-card__action'
      );

      addToCartButtons.forEach((button) => {
        if (button.dataset.enhanced === 'true') return; // Skip if already enhanced
        
        button.dataset.enhanced = 'true';
        
        // Create icon container for the button
        const iconContainer = document.createElement('div');
        iconContainer.className = 'cart-btn-icon';
        iconContainer.innerHTML = `
          <svg class="cart-btn-icon__bag" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <svg class="cart-btn-icon__check" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        `;

        // Wrap button content
        const originalContent = button.innerHTML;
        const textSpan = document.createElement('span');
        textSpan.className = 'cart-btn-text';
        textSpan.innerHTML = originalContent;

        button.innerHTML = '';
        button.appendChild(iconContainer);
        button.appendChild(textSpan);

        // Store original onclick
        const originalOnclick = button.onclick;
        
        button.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Add visual feedback
          button.classList.add('cart-btn--adding');
          
          // Try to extract product data from Shopify context
          const productData = await extractProductDataAsync(button);
          
          if (productData) {
            // Add to our cart context
            addItem(productData);
            console.log('Added to cart:', productData);
          }
          
          // DON'T call original Shopify onclick - we're handling the cart ourselves
          // This prevents Shopify cart redirects
          
          // Change button appearance
          setTimeout(() => {
            button.classList.remove('cart-btn--adding');
            button.classList.add('cart-btn--added');
            const textElement = button.querySelector('.cart-btn-text');
            if (textElement) {
              textElement.innerHTML = 'Added';
            }
          }, 300);
          
          // Reset button after 2 seconds
          setTimeout(() => {
            button.classList.remove('cart-btn--added');
            const textElement = button.querySelector('.cart-btn-text');
            if (textElement) {
              textElement.innerHTML = originalContent;
            }
          }, 2000);
        };
      });
    };

    const extractProductDataAsync = async (_button: HTMLButtonElement) => {
      // Try to get product data from the page context
      let productTitle = document.querySelector('[shopify-data*="product.title"]')?.textContent || 
                          document.querySelector('h1')?.textContent || 
                          document.querySelector('.product-detail__title')?.textContent ||
                          'Product';
      
      // Clean up whitespace in title
      productTitle = productTitle.trim().replace(/\s+/g, ' ');
      
      // Use the improved price extraction with wait
      let price = extractPriceFromPage();
      
      // If no price found immediately, wait a bit for dynamic content
      if (price === 0) {
        price = await waitForPrice(10, 200); // Wait up to 2 seconds with more attempts
      }
      
      // If still no price, try to get it from Shopify's product data
      if (price === 0) {
        try {
          // Try to access Shopify's global data if available
          const shopifyData = (window as any).__SHOPIFY_DATA__;
          if (shopifyData && shopifyData.product && shopifyData.product.selectedOrFirstAvailableVariant) {
            price = shopifyData.product.selectedOrFirstAvailableVariant.price / 100;
          }
        } catch (error) {
          console.warn('Could not get price from Shopify data:', error);
        }
      }
      
      const imageElement = document.querySelector('#main-shopify-media img') as HTMLImageElement;
      const image = imageElement?.src || imageElement?.currentSrc || '/placeholder.jpg';
      
      // Get selected variant/size information and NUMERIC variant ID
      const variantSelector = document.querySelector('shopify-variant-selector');
      let selectedVariant = '';
      let variantId = '';
      
      if (variantSelector) {
        // Try to get the NUMERIC variant ID from Shopify's product JSON
        try {
          const productDataEl = document.querySelector('script[type="application/json"][data-product-json]');
          if (productDataEl) {
            const productData = JSON.parse(productDataEl.textContent || '{}');
            const urlParams = new URLSearchParams(window.location.search);
            const urlVariantId = urlParams.get('variant');
            
            // If variant ID in URL, use that
            if (urlVariantId && productData.variants) {
              const variant = productData.variants.find((v: any) => v.id.toString() === urlVariantId);
              if (variant) {
                variantId = variant.id.toString();
                selectedVariant = variant.title || '';
              }
            }
            
            // Otherwise, try to get the selected variant from the form
            if (!variantId) {
              const form = document.querySelector('product-form form');
              const variantInput = form?.querySelector('input[name="id"]') as HTMLInputElement;
              if (variantInput?.value) {
                variantId = variantInput.value;
                const variant = productData.variants?.find((v: any) => v.id.toString() === variantId);
                if (variant) {
                  selectedVariant = variant.title || '';
                }
              }
            }
          }
        } catch (error) {
          console.warn('Could not get numeric variant ID:', error);
        }
        
        // Fallback: Try to get selected variant title from UI elements
        if (!selectedVariant) {
          const selectedRadio = variantSelector.shadowRoot?.querySelector('input[type="radio"]:checked') ||
                               variantSelector.querySelector('input[type="radio"]:checked') ||
                               variantSelector.shadowRoot?.querySelector('button[aria-checked="true"]') ||
                               variantSelector.querySelector('button[aria-checked="true"]');
          
          if (selectedRadio) {
            selectedVariant = (selectedRadio as HTMLInputElement).value || 
                             (selectedRadio as HTMLInputElement).getAttribute('data-variant-title') ||
                             (selectedRadio as HTMLElement).textContent?.trim() || 
                             (selectedRadio as HTMLElement).getAttribute('title') ||
                             '';
            
            // Try to get variant ID from data attribute
            const dataVariantId = (selectedRadio as HTMLElement).getAttribute('data-variant-id');
            if (dataVariantId) {
              variantId = dataVariantId;
            }
          }
          
          // Alternative: check for select elements
          if (!selectedVariant) {
            const selectedOption = variantSelector.shadowRoot?.querySelector('select option:checked') ||
                                  variantSelector.querySelector('select option:checked');
            if (selectedOption) {
              selectedVariant = (selectedOption as HTMLOptionElement).textContent?.trim() || '';
              const dataVariantId = (selectedOption as HTMLElement).getAttribute('data-variant-id') ||
                                   (selectedOption as HTMLOptionElement).value;
              if (dataVariantId && !isNaN(Number(dataVariantId))) {
                variantId = dataVariantId;
              }
            }
          }
        }
      }
      
      // Generate a consistent ID with proper cleaning
      const productHandle = window.location.pathname.split('/').pop() || '';
      const cleanTitle = productTitle
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .toLowerCase()
        .replace(/^-|-$/g, '');
      
      const cleanVariant = selectedVariant 
        ? selectedVariant
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .replace(/-+/g, '-')
            .toLowerCase()
            .replace(/^-|-$/g, '')
        : 'default';
      
      const productId = selectedVariant ? 
        `${productHandle}-${cleanTitle}-${cleanVariant}` : 
        `${productHandle}-${cleanTitle}`;
      
      console.log('Extracted product data:', {
        id: productId,
        title: productTitle,
        price: price,
        image: image,
        handle: productHandle,
        variantId: variantId, // NUMERIC ID for Shiprocket
        variantTitle: selectedVariant, // Human-readable variant name for display
      });
      
      return {
        id: productId,
        title: productTitle,
        price: price,
        image: image,
        handle: productHandle,
        variantId: variantId, // This is now the numeric ID
        variantTitle: selectedVariant, // This is the display name
      };
    };

    // Initial enhancement
    enhanceAddToCartButtons();

    // Re-enhance when new content is added (for dynamic content)
    const observer = new MutationObserver(() => {
      enhanceAddToCartButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [addItem]);

  // Add styles for enhanced buttons
  useEffect(() => {
    if (!document.getElementById('cart-enhancer-styles')) {
      const styles = document.createElement('style');
      styles.id = 'cart-enhancer-styles';
      styles.textContent = `
        .cart-btn-icon {
          display: inline-flex;
          align-items: center;
          margin-right: 8px;
          position: relative;
          width: 18px;
          height: 18px;
        }
        
        .cart-btn-icon__bag,
        .cart-btn-icon__check {
          position: absolute;
          top: 0;
          left: 0;
          transition: all 0.3s ease;
        }
        
        .cart-btn-icon__bag {
          opacity: 1;
          transform: scale(1);
        }
        
        .cart-btn-icon__check {
          opacity: 0;
          transform: scale(0);
        }
        
        .cart-btn--adding {
          animation: cartBtnPulse 0.3s ease-out;
        }
        
        .cart-btn--added .cart-btn-icon__bag {
          opacity: 0;
          transform: scale(0);
        }
        
        .cart-btn--added .cart-btn-icon__check {
          opacity: 1;
          transform: scale(1);
          color: #10b981;
        }
        
        .cart-btn--added {
          background-color: #f0fdf4 !important;
          border-color: #10b981 !important;
          color: #10b981 !important;
        }
        
        @keyframes cartBtnPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(styles);
    }
  }, []);

  return null; // This component doesn't render anything
};