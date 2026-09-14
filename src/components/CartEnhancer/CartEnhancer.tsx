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
          }
          
          // Call original Shopify onclick after our logic
          if (originalOnclick) {
            setTimeout(() => {
              originalOnclick.call(button, e);
            }, 100);
          }
          
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

    const extractProductDataAsync = async (button: HTMLButtonElement) => {
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
      
      // Get selected variant/size information
      const variantSelector = document.querySelector('shopify-variant-selector');
      let selectedVariant = '';
      
      if (variantSelector) {
        // Try to get selected variant from Shopify's variant selector
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
        }
        
        // Alternative: check for select elements
        if (!selectedVariant) {
          const selectedOption = variantSelector.shadowRoot?.querySelector('select option:checked') ||
                                variantSelector.querySelector('select option:checked');
          if (selectedOption) {
            selectedVariant = (selectedOption as HTMLOptionElement).textContent?.trim() || '';
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
        variantId: selectedVariant,
      });
      
      return {
        id: productId,
        title: productTitle,
        price: price,
        image: image,
        handle: productHandle,
        variantId: selectedVariant,
      };
    };

    const extractProductData = (button: HTMLButtonElement) => {
      // Try to get product data from the page context
      const productTitle = document.querySelector('[shopify-data*="product.title"]')?.textContent || 
                          document.querySelector('h1')?.textContent || 
                          document.querySelector('.product-detail__title')?.textContent ||
                          'Product';
      
      // Enhanced price extraction with multiple fallbacks
      let price = 0;
      
      // Try to get price from Shopify money element
      const shopifyMoneyElement = document.querySelector('shopify-money');
      if (shopifyMoneyElement) {
        const moneyText = shopifyMoneyElement.textContent || shopifyMoneyElement.innerHTML;
        if (moneyText) {
          // Extract numbers from various currency formats
          const priceMatch = moneyText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(/,/g, ''));
          }
        }
      }
      
      // Fallback: try other price selectors
      if (!price) {
        const priceSelectors = [
          '.product-detail__price',
          '[class*="price"]',
          '[data-price]',
          '.price',
          '.product-price'
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = document.querySelector(selector);
          if (priceElement) {
            const priceText = priceElement.textContent || priceElement.getAttribute('data-price');
            if (priceText) {
              // Extract price from text like "₹11,000", "$99.99", "11000", etc.
              const priceMatch = priceText.match(/[\d,]+\.?\d*/);
              if (priceMatch) {
                const extractedPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
                if (extractedPrice > 0) {
                  price = extractedPrice;
                  break;
                }
              }
            }
          }
        }
      }
      
      // Final fallback: try to get from any element containing currency symbols
      if (!price) {
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent;
          if (text && (text.includes('₹') || text.includes('$') || text.includes('INR'))) {
            const priceMatch = text.match(/[₹$]?[\d,]+\.?\d*/);
            if (priceMatch) {
              const extractedPrice = parseFloat(priceMatch[0].replace(/[₹$,]/g, ''));
              if (extractedPrice > 50 && extractedPrice < 100000) { // Reasonable price range
                price = extractedPrice;
                break;
              }
            }
          }
        }
      }
      
      const imageElement = document.querySelector('#main-shopify-media img') as HTMLImageElement;
      const image = imageElement?.src || imageElement?.currentSrc || '/placeholder.jpg';
      
      // Get selected variant/size information
      const variantSelector = document.querySelector('shopify-variant-selector');
      let selectedVariant = '';
      
      if (variantSelector) {
        // Try to get selected variant from Shopify's variant selector
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
        }
        
        // Alternative: check for select elements
        if (!selectedVariant) {
          const selectedOption = variantSelector.shadowRoot?.querySelector('select option:checked') ||
                                variantSelector.querySelector('select option:checked');
          if (selectedOption) {
            selectedVariant = (selectedOption as HTMLOptionElement).textContent?.trim() || '';
          }
        }
      }
      
      // Generate a consistent ID that doesn't change based on timestamp
      const productHandle = window.location.pathname.split('/').pop() || '';
      const cleanTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const cleanVariant = selectedVariant ? selectedVariant.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'default';
      const productId = selectedVariant ? 
        `${productHandle}-${cleanTitle}-${cleanVariant}` : 
        `${productHandle}-${cleanTitle}`;
      
      console.log('Extracted product data:', {
        id: productId,
        title: productTitle,
        price: price,
        image: image,
        handle: productHandle,
        variantId: selectedVariant,
      });
      
      return {
        id: productId,
        title: productTitle,
        price: price,
        image: image,
        handle: productHandle,
        variantId: selectedVariant,
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