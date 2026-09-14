// Utility to extract price from various DOM elements and text formats
export const extractPriceFromPage = (): number => {
  // Method 1: Try Shopify money elements - MOST RELIABLE
  const shopifyMoneyElements = document.querySelectorAll('shopify-money');
  for (const element of shopifyMoneyElements) {
    const price = extractPriceFromElement(element);
    if (price > 0) return price;
  }

  // Method 2: Look for hidden Shopify data attributes
  const dataElements = document.querySelectorAll('[data-price], [data-amount], [price]');
  for (const element of dataElements) {
    let priceStr = element.getAttribute('data-price') || 
                   element.getAttribute('data-amount') || 
                   element.getAttribute('price');
    if (priceStr) {
      const price = parseFloat(priceStr);
      if (price > 0) return price;
    }
  }

  // Method 3: Try common price selectors
  const priceSelectors = [
    '.product-detail__price',
    '.product-price',
    '[class*="price"]',
    '.price',
    '.money',
    '[class*="amount"]'
  ];

  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const price = extractPriceFromElement(element);
      if (price > 0) return price;
    }
  }

  // Method 4: Search for currency symbols in all visible text
  const allElements = document.querySelectorAll('*');
  const prices: { price: number; frequency: number }[] = [];
  
  for (const element of allElements) {
    // Skip script, style, and hidden elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') continue;
    if ((element as HTMLElement).offsetParent === null) continue; // Skip hidden elements
    
    const text = element.textContent?.trim();
    if (!text || text.length < 2) continue;

    // Look for direct child text nodes only (to avoid scanning entire page)
    const directText = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent?.trim() || '')
      .join(' ');

    if (!directText) continue;

    // Look for Indian Rupee patterns
    const rupeePatterns = [
      { pattern: /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, name: 'rupee-symbol' },
      { pattern: /INR\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, name: 'inr-text' },
      { pattern: /Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, name: 'rs-text' }
    ];

    for (const { pattern } of rupeePatterns) {
      let match;
      while ((match = pattern.exec(directText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price >= 100 && price <= 100000) { // Reasonable price range for shoes
          // Track frequency
          const existing = prices.find(p => p.price === price);
          if (existing) {
            existing.frequency++;
          } else {
            prices.push({ price, frequency: 1 });
          }
        }
      }
    }
  }

  // Return the most frequently found price
  if (prices.length > 0) {
    prices.sort((a, b) => b.frequency - a.frequency);
    return prices[0].price;
  }

  return 0;
};

export const extractPriceFromElement = (element: Element): number => {
  if (!element) return 0;

  // Try data attributes first
  const dataPrice = element.getAttribute('data-price') || 
                    element.getAttribute('data-amount') ||
                    element.getAttribute('price');
  if (dataPrice) {
    const price = parseFloat(dataPrice);
    if (!isNaN(price) && price > 0) return price;
  }

  // Try text content
  let text = element.textContent?.trim();
  if (!text) return 0;

  // Clean whitespace but keep structure
  text = text.replace(/\s+/g, ' ');
  
  // Try to extract rupee amount first (most reliable)
  let match = text.match(/₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(price) && price > 0) return price;
  }

  // Try other currency formats
  match = text.match(/(?:INR|Rs\.?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (match) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(price) && price > 0) return price;
  }

  // Try direct number with reasonable shoe price range
  const numberMatch = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (numberMatch) {
    const price = parseFloat(numberMatch[1].replace(/,/g, ''));
    if (!isNaN(price) && price >= 100 && price <= 100000) return price;
  }

  return 0;
};

// Function to wait for price to be available (for async loading)
export const waitForPrice = (maxAttempts = 20, interval = 200): Promise<number> => {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkPrice = () => {
      const price = extractPriceFromPage();
      
      if (price > 0) {
        resolve(price);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.warn('Could not extract price after', maxAttempts, 'attempts');
        resolve(0);
        return;
      }
      
      setTimeout(checkPrice, interval);
    };
    
    checkPrice();
  });
};