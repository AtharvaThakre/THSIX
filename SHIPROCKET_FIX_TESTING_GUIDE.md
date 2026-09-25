# Shiprocket Checkout Fix - Testing Guide

## Overview
This guide covers testing the fixed Shiprocket integration that now correctly sends variant IDs and sizes to the checkout API.

## What Was Fixed

### Critical Changes
1. **Buy Now button** now uses direct product checkout (`type: 'product'`)
2. **Variant ID extraction** simplified and made reliable across all flows
3. **Numeric ID format** ensured throughout (no GID prefixes)
4. **Better error handling** with validation and clear messages

---

## Pre-Testing Checklist

### 1. Verify Environment
```bash
# Check that you're testing the latest code
git status
```

### 2. Verify Shiprocket Script Loads
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `window.shiprocketCheckoutEvents`
4. **Expected**: Object with `buyDirect` function
5. **If undefined**: Check Network tab for script blocking

### 3. Verify Seller Domain
1. In Console: `document.getElementById('sellerDomain').value`
2. **Expected**: `"thsix.com"`
3. **If different**: Check index.html configuration

---

## Test Cases

### Test A: Buy Now with Selected Size

**Purpose**: Verify Buy Now uses correct variant ID for selected size

**Steps**:
1. Navigate to any product page with size options
2. Open DevTools Console (F12)
3. Select a specific size (e.g., UK 7)
4. Click "Buy Now" button
5. Monitor console logs

**Expected Console Output**:
```
Buy Now clicked - using Shiprocket direct checkout
Variant ID from [source]: [numeric ID]
Final selected variant ID: 50501821890725
Loading Shiprocket integration...
Shiprocket ready
Initiating Shiprocket direct product checkout with variant: 50501821890725
Shiprocket buyDirect() params: {
  "type": "product",
  "products": [{
    "variantId": "50501821890725",
    "quantity": 1
  }]
}
Shiprocket checkout initiated successfully
```

**Expected Result**:
- ✅ Shiprocket checkout modal opens
- ✅ Product displayed with correct name
- ✅ Selected size is shown (e.g., "Size: UK 7")
- ✅ Correct price displayed
- ✅ Quantity shows 1

**Red Flags**:
- ❌ "Please select a size" error → variant ID extraction failed
- ❌ Wrong size shown in checkout → incorrect variant ID
- ❌ Checkout redirects to Shopify cart → script not loaded
- ❌ "Checkout service is not available" → script timeout

---

### Test B: Buy Now Size Change

**Purpose**: Verify changing size updates the variant ID

**Steps**:
1. On product page, select size UK 7
2. Wait 1 second
3. Change to size UK 8
4. Click "Buy Now"
5. Check console logs for variant ID

**Expected**:
- Console shows UK 8 variant ID (not UK 7)
- Checkout displays UK 8

**Validation**:
Check `window.selectedVariantId` in console:
```javascript
window.selectedVariantId
// Should show the numeric ID for UK 8
```

---

### Test C: Add to Cart Flow

**Purpose**: Verify Add to Cart extracts correct variant data

**Steps**:
1. Navigate to product page
2. Select size UK 7
3. Click "Add to Cart"
4. Check console for extraction logs

**Expected Console Output**:
```
Variant from shopify-store: 50501821890725 UK7
Extracted product data: {
  id: "...",
  variantId: "50501821890725",
  variantTitle: "UK7",
  price: 3499,
  ...
}
Added to cart: {...}
```

**Expected Result**:
- Cart badge updates (+1)
- Cart sidebar shows correct product
- Size displayed as "Size: UK7"

---

### Test D: Cart Checkout with Multiple Items

**Purpose**: Verify cart checkout with multiple products

**Steps**:
1. Add multiple products with different sizes to cart:
   - Product A, Size UK 7
   - Product B, Size UK 8
2. Open cart sidebar
3. Verify each item shows correct size
4. Click "Checkout"
5. Monitor console logs

**Expected Console Output**:
```
Starting checkout process...
Cart items: [{variantId: "...", quantity: 1}, ...]
Loading Shiprocket integration...
Shiprocket is ready
Syncing cart to Shopify...
Prepared Shopify cart items: [{id: "50501821890725", quantity: 1}, ...]
Cart synced to Shopify successfully
Initiating cart checkout...
Shiprocket buyDirect() params: {"type": "cart"}
Shiprocket checkout initiated successfully
```

**Expected Result**:
- ✅ Shiprocket checkout modal opens
- ✅ All products listed with correct names
- ✅ Correct sizes shown for each product
- ✅ Correct quantities
- ✅ Total price accurate

---

### Test E: Buy Now Without Size Selection

**Purpose**: Verify validation prevents checkout without variant

**Steps**:
1. Navigate to product page with size options
2. **DO NOT** select a size
3. Click "Buy Now"

**Expected Result**:
- Alert: "Please select a size before proceeding to checkout."
- Checkout does NOT open
- Button returns to normal state

**Note**: If product has only one variant (no size options), it should proceed automatically.

---

### Test F: Cart with No Items

**Purpose**: Verify empty cart handling

**Steps**:
1. Clear cart completely
2. Open cart sidebar
3. Try to click checkout (button should be hidden)

**Expected Result**:
- Cart shows "Your cart is empty" message
- No checkout button visible
- No errors in console

---

### Test G: Network Request Validation

**Purpose**: Verify correct data sent to Shopify cart API

**Steps**:
1. Open DevTools → Network tab
2. Filter: `cart/add.js`
3. Add product to cart
4. Click checkout
5. Inspect request payload

**Expected Request to `/cart/add.js`**:
```json
{
  "items": [{
    "id": "50501821890725",
    "quantity": 1
  }]
}
```

**Validation Points**:
- ✅ `id` is numeric string (not GID format)
- ✅ `id` is at least 8 characters long
- ✅ `quantity` is correct
- ✅ Response status 200

---

### Test H: Console Data Verification

**Purpose**: Manually verify variant IDs in localStorage

**Steps**:
1. Add products to cart
2. Open Console
3. Run:
```javascript
JSON.parse(localStorage.getItem('thsix_cart'))
```

**Expected Output**:
```javascript
[
  {
    "id": "...",
    "title": "Product Name",
    "price": 3499,
    "variantId": "50501821890725",  // ← NUMERIC
    "variantTitle": "UK7",            // ← READABLE
    "quantity": 1,
    ...
  }
]
```

**Validation**:
- ✅ `variantId` is numeric (no "gid://")
- ✅ `variantTitle` shows human-readable size
- ✅ Both fields present

---

### Test I: Buy Now on Page Load

**Purpose**: Verify variant tracking starts correctly

**Steps**:
1. Navigate to product page
2. Wait for page to fully load
3. **Without clicking anything**, run in console:
```javascript
window.selectedVariantId
```

**Expected**:
- Shows numeric variant ID of first available variant
- OR `null` if not yet initialized

4. Select a size
5. Run again: `window.selectedVariantId`

**Expected**:
- Shows numeric ID of selected variant

---

### Test J: Rapid Clicks

**Purpose**: Verify button doesn't allow duplicate requests

**Steps**:
1. Navigate to product page
2. Select a size
3. Rapidly click "Buy Now" 5 times
4. Check console logs

**Expected**:
- Only ONE checkout initiated
- Button disabled during processing
- Button shows "Loading..." state
- No duplicate API calls

---

## Debugging Commands

### Check Shiprocket Status
```javascript
console.log('Shiprocket loaded:', typeof window.shiprocketCheckoutEvents !== 'undefined');
console.log('Seller domain:', document.getElementById('sellerDomain')?.value);
```

### Check Current Variant
```javascript
console.log('Tracked variant:', window.selectedVariantId);

const shopifyStore = document.querySelector('shopify-store');
if (shopifyStore) {
  console.log('Shopify variant:', shopifyStore.product?.selectedOrFirstAvailableVariant?.id);
}
```

### Check Cart Data
```javascript
const cart = JSON.parse(localStorage.getItem('thsix_cart') || '[]');
console.table(cart.map(item => ({
  title: item.title,
  variantId: item.variantId,
  variantTitle: item.variantTitle,
  quantity: item.quantity
})));
```

### Manual Checkout Trigger
```javascript
// Test cart checkout
window.shiprocketCheckoutEvents?.buyDirect({ type: 'cart' });

// Test product checkout
window.shiprocketCheckoutEvents?.buyDirect({
  type: 'product',
  products: [{
    variantId: '50501821890725',  // Replace with actual ID
    quantity: 1
  }]
});
```

---

## Common Issues and Solutions

### Issue 1: Variant ID is Still "UK7" or Size Name

**Symptom**: Console shows `variantId: "UK7"` instead of numeric ID

**Cause**: Extraction logic not using numeric ID

**Solution**: Already fixed in the code. If you see this:
1. Hard refresh (Ctrl + Shift + R)
2. Clear cache
3. Verify latest code deployed

### Issue 2: "Checkout service is not available"

**Symptom**: Error after clicking Buy Now

**Causes**:
1. Shiprocket script didn't load
2. Script timeout (network issue)
3. Script blocked by ad blocker

**Solution**:
1. Check Network tab for blocked scripts
2. Disable ad blocker
3. Check `window.shiprocketCheckoutEvents`

### Issue 3: Wrong Size in Checkout

**Symptom**: Selected UK 7, but checkout shows UK 8

**Cause**: Variant ID doesn't match selected size

**Debug**:
```javascript
// After selecting size, before clicking Buy Now
const shopifyStore = document.querySelector('shopify-store');
console.log('Selected variant:', shopifyStore?.product?.selectedOrFirstAvailableVariant);
```

**Solution**: Check if variant selector properly updates Shopify state

### Issue 4: Checkout Redirects to Shopify Cart

**Symptom**: Opens Shopify cart page instead of Shiprocket modal

**Causes**:
1. Shiprocket script not loaded
2. Seller domain incorrect
3. Invalid variant ID format

**Debug**:
```javascript
console.log('Script loaded:', typeof window.shiprocketCheckoutEvents);
console.log('Seller domain:', document.getElementById('sellerDomain').value);
```

### Issue 5: Empty Checkout Modal

**Symptom**: Shiprocket modal opens but shows no products

**Cause**: Cart not synced to Shopify before checkout

**Solution**: Already fixed for cart checkout. For Buy Now, now uses `type: 'product'` so no cart sync needed.

---

## Success Criteria

### All Tests Must Pass:
- [✓] Buy Now with selected size opens correct checkout
- [✓] Changing size updates variant ID
- [✓] Add to Cart extracts numeric variant IDs
- [✓] Cart checkout works with multiple items
- [✓] Validation prevents checkout without size
- [✓] Console logs show numeric variant IDs (no GID format)
- [✓] Checkout displays correct products and sizes
- [✓] No JavaScript errors in console

### Network Requests Valid:
- [✓] `/cart/add.js` receives numeric variant IDs
- [✓] No unnecessary cart API calls for Buy Now
- [✓] Request format matches Shiprocket expectations

### User Experience:
- [✓] Fast checkout (no unnecessary delays)
- [✓] Clear error messages
- [✓] Loading states visible
- [✓] Correct product info in checkout

---

## Reporting Issues

If any test fails, collect:

1. **Console logs** (complete output from Buy Now/Checkout click)
2. **Network requests** (especially cart/add.js payload)
3. **localStorage cart data** (`localStorage.getItem('thsix_cart')`)
4. **Shiprocket status** (`window.shiprocketCheckoutEvents`)
5. **Steps to reproduce**
6. **Expected vs actual result**

---

## Post-Testing Verification

After all tests pass:

1. **Test on different browsers**:
   - Chrome
   - Firefox
   - Safari
   - Edge

2. **Test on mobile devices**:
   - iOS Safari
   - Android Chrome

3. **Test with different products**:
   - Products with size variants
   - Products with color variants
   - Products with multiple option types
   - Products with single variant (no options)

4. **Monitor for 24 hours**:
   - Check error logs
   - Monitor checkout conversion rate
   - Verify orders appear in Shiprocket dashboard

---

## Rollback Plan

If critical issues found:

1. Revert changes: `git revert [commit-hash]`
2. Redeploy previous version
3. Document issue for investigation
4. Implement fix and re-test

---

**Last Updated**: 2026-09-25
**Version**: 1.0
**Status**: Ready for Testing
