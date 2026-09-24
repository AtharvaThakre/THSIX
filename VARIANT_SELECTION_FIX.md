# Variant Selection Fix - Testing Guide

## What Was Fixed

The "Please select a size before buying" error was showing even when a size was selected. This happened because:

1. **Shopify web components** use shadow DOM which is hard to query
2. **No global tracking** of selected variant
3. **Multiple variant selector implementations** (shadow DOM, regular DOM, URL params)

## Solution Implemented

Created **5 fallback methods** to detect the selected variant:

### Method 1: Global Tracker (Primary)
```javascript
window.selectedVariantId = "50501821890725"
```
- Updated whenever any variant is selected
- Checked first before other methods

### Method 2: Form Input
```html
<input name="id" value="50501821890725">
```
- Standard Shopify product form
- Works with traditional forms

### Method 3: URL Parameters
```
?variant=50501821890725
```
- When variant is in URL
- Works after page reload with variant selected

### Method 4: Shopify Variant Selector
- Checks shadow DOM for selected radio/button
- Looks for `aria-checked="true"` or `:checked`

### Method 5: First Available Variant
- Fallback if nothing else works
- Uses first available variant from product data
- Shows warning in console

## Testing After Deployment

### Test 1: Select Size and Buy Now

1. Go to product page
2. **Select a size** (e.g., UK7)
3. Open Console (F12)
4. Check that you see: `Variant selected: 50501821890725`
5. Click **"Buy Now"**
6. **Expected:** Shiprocket modal opens
7. **Should NOT see:** "Please select a size before buying"

### Test 2: Add to Cart

1. Select a size
2. Click **"Add to Cart"**
3. Open cart sidebar
4. Click **"Checkout"**
5. **Expected:** Shiprocket modal opens with selected product

### Test 3: Check Global Tracker

In Console (F12):
```javascript
// After selecting a size, this should return a number
console.log(window.selectedVariantId);
// Example: "50501821890725"
```

### Test 4: Variant Change Tracking

1. Select UK7
2. Check console: `Variant selected: 50501821890725`
3. Select UK8
4. Check console: `Variant selected: 50501821956261` (different ID)
5. Each selection updates the global tracker

## Debug Commands

If issues persist, run these in Console:

```javascript
// 1. Check global tracker
console.log('Global variant ID:', window.selectedVariantId);

// 2. Check if Buy Now handler exists
console.log('Buy Now handler:', typeof window.handleBuyNow);

// 3. Check Shiprocket loaded
console.log('Shiprocket:', typeof shiprocketCheckoutEvents);

// 4. Check variant selector
const vs = document.querySelector('shopify-variant-selector');
console.log('Variant selector exists:', !!vs);

// 5. Manually trigger Buy Now (if handler exists)
// Click a size first, then run:
const buyBtn = document.querySelector('.product-detail__buy-btn');
if (buyBtn && window.handleBuyNow) {
  window.handleBuyNow({ target: buyBtn, preventDefault: () => {}, stopPropagation: () => {} });
}
```

## Event Listeners Added

### On App Mount:
- `variant:change` - Shopify's variant change event
- `change` on variant-selector - Tracks selector changes

### On ProductDetailPage:
- `click` (capture phase) - Tracks clicks on variant buttons
- `change` (capture phase) - Tracks radio button changes

## Expected Console Output

When selecting a size:
```
Variant selected: 50501821890725
```

When clicking Buy Now:
```
Buy Now clicked - using Shiprocket checkout
Variant ID from global tracker: 50501821890725
Final selected variant ID: 50501821890725
Shiprocket ready, initiating Buy Now checkout
Shiprocket Buy Now initiated
```

When clicking Checkout from cart:
```
Starting checkout process...
Cart items: [array with variantId]
Shiprocket checkout initiated successfully
```

## Troubleshooting

### Still Says "Please select a size"

**Check:**
1. Console for "Variant selected" message
2. `window.selectedVariantId` is set
3. Clear cache and try again

**Fix:**
- Manually click the size button again
- Refresh page and reselect

### Variant tracker not updating

**Check:**
- Event listeners are attached: `getEventListeners(document)`
- Variant buttons have correct attributes

**Fix:**
- Hard reload (Ctrl+Shift+R)
- Clear localStorage and cache

### Buy Now still redirects to Shopify

**This means:**
- Shiprocket script not loaded
- Or Buy Now handler not initialized

**Check:**
```javascript
console.log(typeof shiprocketCheckoutEvents); // Should be "object"
console.log(typeof window.handleBuyNow);       // Should be "function"
```

## Success Criteria

✅ Selecting a size updates `window.selectedVariantId`  
✅ Console shows "Variant selected: [ID]"  
✅ Buy Now triggers Shiprocket (no "select size" error)  
✅ Checkout from cart works  
✅ Shiprocket modal opens (no Shopify redirect)  

---

*Deployed: Comprehensive variant tracking with 5 fallback methods*
