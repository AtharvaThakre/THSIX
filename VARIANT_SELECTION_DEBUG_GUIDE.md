# Variant Selection Debug Guide

## Problem Statement
Buy Now button fails with "Please select a size" error even after user selects a size on the product page. The variant selection state is not being captured properly.

## Changes Made

### 1. **Removed Redundant Tracking Code** (`ProductDetailPage.tsx`)
- Deleted the `useEffect` hook that tried to track variant clicks manually
- This code was attempting to listen to `.product-detail__size-btn` which doesn't exist
- The `shopify-variant-selector` web component has Shadow DOM, so external event listeners don't work

### 2. **Enhanced Variant Tracking** (`shiprocket-buy-now.ts`)
- Replaced event-based tracking with MutationObserver pattern
- Now watches the `shopify-store` element for ANY changes to its DOM/attributes
- When the store updates, we extract the variant from its internal state
- This works because Shopify's web components update the store element when user selects a size

### 3. **Added Comprehensive Debug Logging**
All variant selection attempts now log to console with:
- `===` markers for major operations
- `✓` for successful retrievals
- `✗` for failures
- `🔄` for state updates
- Detailed information about what was found at each step

## How to Test

### Step 1: Deploy and Open Product Page
```bash
npm run build
# Deploy dist/ to your hosting
# Open any product page (e.g., /products/nike-air-max)
```

### Step 2: Open Browser Console
Press F12 → Console tab

### Step 3: Check Initialization
Look for these logs on page load:
```
=== Initializing Shiprocket Buy Now handler ===
Looking for shopify-store element (attempt 1)...
Looking for shopify-store element (attempt 2)...
✓ Found shopify-store element, setting up observer
✓ Initial variant from store: 50501821890725
✓ Shiprocket Buy Now handler initialized
```

**Expected**: You should see the initial variant ID logged (usually the first available size)

### Step 4: Select a Different Size
Click on any size button.

**Expected Console Output**:
```
🔄 Variant updated from store observer: 50501821890956
```

This confirms the MutationObserver detected the change.

### Step 5: Click Buy Now
**Expected Console Output**:
```
Buy Now clicked - using Shiprocket direct checkout
=== DEBUG: Getting selected variant ID ===
Checking global tracker: 50501821890956
✓ Variant ID from global tracker: 50501821890956
Final selected variant ID: 50501821890956
Loading Shiprocket integration...
Waiting for Shiprocket to be ready...
Shiprocket ready
Initiating Shiprocket direct product checkout with variant: 50501821890956
Shiprocket Buy Now initiated successfully
```

## Troubleshooting Scenarios

### Scenario A: "shopify-store element not found after 5 seconds"
**Problem**: The Shopify web components didn't load properly

**Possible Causes**:
1. Shopify script not loaded in `index.html`
2. Network error blocking the script
3. Incorrect `seller-domain` in index.html

**Fix**:
- Check `index.html` has: `<shopify-config seller-domain="thsix.com">`
- Verify this script loads: `https://shopify.themerexthemes.com/assets/js/main-esm-app.js`

### Scenario B: No variant update when clicking size
**Problem**: MutationObserver not detecting changes

**Debug Steps**:
1. In console, run: `document.querySelector('shopify-store')`
2. Check if it returns an element
3. In console, run: `document.querySelector('shopify-store').product`
4. Check if it has `selectedOrFirstAvailableVariant` property

**Possible Causes**:
- Shopify web components failing to initialize
- `shopify-context` not wrapping the product properly
- Browser blocking the web components

### Scenario C: "shopify-store element:" logs `null`
**Problem**: The product template isn't rendering the store element

**Fix**:
- Verify `ProductDetailPage.tsx` has:
  ```jsx
  <shopify-context type="product" handle={handle || 'default-product'}>
  ```
- Make sure handle param exists: check URL is `/products/[handle]`

### Scenario D: Variant ID found but Shiprocket fails
**Problem**: Shiprocket integration issue, not variant selection

**Check**:
- Is Pickrr script loaded? Look for `window.shiprocketCheckoutEvents`
- Is seller domain correct? Should be `thsix.com`
- Check Network tab for failed requests to fastrr-boost-ui.pickrr.com

## Expected Flow (When Working)

```
User loads page
    ↓
Shopify web components initialize
    ↓
shopify-store element appears in DOM
    ↓
Our MutationObserver attaches to it
    ↓
Initial variant captured (first available)
    ↓
User clicks size button
    ↓
shopify-variant-selector updates shopify-store
    ↓
MutationObserver fires
    ↓
We extract new variant ID → window.selectedVariantId
    ↓
User clicks Buy Now
    ↓
getSelectedVariantId() reads window.selectedVariantId
    ↓
Shiprocket checkout opens with correct variant
```

## What Changed from Previous Implementation

### Before:
- Tried to listen to click events on size buttons
- Looked for CSS class `.product-detail__size-btn` (doesn't exist)
- Used `setTimeout` delays hoping Shopify would update
- Multiple redundant event listeners

### After:
- Watch the `shopify-store` element directly using MutationObserver
- No CSS class dependencies
- No arbitrary delays - reacts immediately to DOM changes
- Single observer watching the source of truth

## Files Modified
1. `src/utils/shiprocket-buy-now.ts` - Enhanced tracking and debug logs
2. `src/pages/ProductDetailPage.tsx` - Removed broken tracking code

## Next Steps for User

1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Open console before clicking anything
3. Select a size and watch console logs
4. Copy/paste the console output for debugging
5. If Shiprocket still fails, the issue is with their integration, not variant selection
