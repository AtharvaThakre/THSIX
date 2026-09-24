# Final Shiprocket Integration Testing Guide

## 🎯 Critical Fixes Applied

### Fix #1: Seller Domain
✅ Changed from `19sjnp-gx.myshopify.com` to `thsix.com`

### Fix #2: Variant ID Extraction
✅ Now extracts **numeric Shopify variant IDs** (e.g., `50501821890725`) instead of variant titles (e.g., "UK7")

### Fix #3: Cart Data Structure
✅ Now stores both:
- `variantId` - Numeric ID for Shiprocket checkout
- `variantTitle` - Display name for user (e.g., "UK7")

---

## 🧪 Step-by-Step Testing

### Before You Start

1. **Clear Everything**
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Clear storage" → "Clear site data"
   - Close and reopen browser

2. **Check Deployment Status**
   - Go to https://vercel.com/dashboard
   - Verify latest commit is deployed
   - Status should be "Ready"

### Test 1: Verify Shiprocket Script Loads

1. Go to https://thsix.com
2. Open DevTools Console (F12)
3. Type: `shiprocketCheckoutEvents`
4. **Expected:** Object with `buyDirect` function
5. **If undefined:** Script blocked or not loaded

### Test 2: Verify Seller Domain

1. In Console, type: `document.getElementById('sellerDomain').value`
2. **Expected:** `"thsix.com"`
3. **If wrong:** Hard reload (Ctrl+Shift+R)

### Test 3: Add Product to Cart

1. Go to any product page
2. Select a size (e.g., UK7)
3. Click "Add to Cart"
4. **Watch console output** - should show:
   ```
   Extracted product data: {
     variantId: "50501821890725", // <-- NUMERIC ID
     variantTitle: "UK7"           // <-- DISPLAY NAME
   }
   ```

### Test 4: Verify Cart Storage

1. After adding product, in Console type:
   ```javascript
   JSON.parse(localStorage.getItem('thsix_cart'))
   ```
2. **Expected output:**
   ```json
   [{
     "id": "...",
     "title": "Product Name",
     "price": 3499,
     "image": "...",
     "quantity": 1,
     "variantId": "50501821890725",    // NUMERIC
     "variantTitle": "UK7",             // READABLE
     "handle": "product-handle"
   }]
   ```
3. **Critical:** `variantId` MUST be a long number

### Test 5: Check Cart Display

1. Open cart sidebar
2. **Verify:**
   - Product name shows correctly
   - Size shows as "Size: UK7" (or selected size)
   - Price is correct
   - Image displays

### Test 6: Initiate Checkout

1. Click "Checkout" button
2. **Watch Console - Expected logs:**
   ```
   Starting checkout process...
   Cart items: [array with variantId as numbers]
   Loading Shiprocket integration...
   Waiting for Shiprocket to be ready...
   Shiprocket is ready
   Syncing cart to Shopify...
   Syncing cart to Shopify... [array]
   Shopify cart cleared
   Prepared Shopify cart items: [{id: "50501821890725", quantity: 1}]
   Cart synced to Shopify successfully
   Cart synced successfully
   Initiating Shiprocket checkout...
   Shiprocket checkout params: {type: "cart"}
   Shiprocket checkout initiated successfully
   ```

3. **Expected Result:**
   - ✅ Shiprocket modal opens
   - ✅ Products visible in modal
   - ✅ Can see size/variant info
   - ❌ Should NOT redirect to Shopify cart

### Test 7: Complete Checkout Flow

If Shiprocket modal opens:

1. **Verify products in modal:**
   - Correct product names
   - Correct quantities
   - Correct prices
   - Variant info visible

2. **Fill shipping details:**
   - Full name
   - Address
   - Phone number
   - Pincode

3. **Select payment method:**
   - COD / Online Payment

4. **Place test order**

5. **Verify success:**
   - Redirects to success page
   - Cart clears
   - Order ID displayed

---

## 🚨 Troubleshooting

### Issue: Still Redirects to Shopify Cart

**Possible Causes:**

1. **Variant ID still not numeric**
   ```javascript
   // Check cart data
   JSON.parse(localStorage.getItem('thsix_cart'))
   // variantId should be like "50501821890725", NOT "UK7"
   ```

2. **Seller domain wrong**
   ```javascript
   document.getElementById('sellerDomain').value
   // Should be "thsix.com"
   ```

3. **Shiprocket script not loaded**
   ```javascript
   shiprocketCheckoutEvents
   // Should return object, not undefined
   ```

4. **API keys not in Vercel**
   - Go to Vercel Dashboard
   - Settings → Environment Variables
   - Verify SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET exist

### Issue: variantId is Still "UK7" (Not Numeric)

**This means the extraction failed. Debug:**

1. Check if product JSON exists:
   ```javascript
   document.querySelector('script[type="application/json"][data-product-json]')
   // Should return <script> element
   ```

2. Check product form:
   ```javascript
   document.querySelector('product-form form input[name="id"]')
   // Should return input with numeric value
   ```

3. **Manual fix:** Contact me with console logs

### Issue: Shiprocket Modal Opens But Products Missing

**Check Shopify cart sync:**
```javascript
fetch('https://19sjnp-gx.myshopify.com/cart.js')
  .then(r => r.json())
  .then(console.log)
```

Should show items with numeric IDs.

---

## ✅ Success Criteria

Shiprocket integration is production-ready when ALL these pass:

- [ ] `shiprocketCheckoutEvents` is defined
- [ ] `sellerDomain` is "thsix.com"
- [ ] Cart items have numeric `variantId`
- [ ] Cart displays correct variant titles
- [ ] Clicking checkout opens Shiprocket modal
- [ ] Products visible in Shiprocket modal
- [ ] Can complete checkout
- [ ] Success page works
- [ ] Cart clears after order
- [ ] Order appears in Shiprocket dashboard

---

## 📊 What Each Fix Does

### Before Fixes:
```
User adds product → variantId = "UK7" (title)
↓
Cart syncs → Shopify cart gets "UK7" (invalid)
↓
Shiprocket can't find product → Redirects to Shopify cart
```

### After Fixes:
```
User adds product → variantId = "50501821890725" (numeric ID)
↓
Cart syncs → Shopify cart gets "50501821890725" (valid)
↓
Shiprocket finds product → Opens checkout modal ✅
```

---

## 🎬 Quick Test Commands

Copy-paste these in Console for quick testing:

```javascript
// 1. Check Shiprocket loaded
console.log('Shiprocket:', typeof shiprocketCheckoutEvents);

// 2. Check seller domain
console.log('Domain:', document.getElementById('sellerDomain')?.value);

// 3. Check cart data
console.log('Cart:', JSON.parse(localStorage.getItem('thsix_cart')));

// 4. Check Shopify cart
fetch('https://19sjnp-gx.myshopify.com/cart.js')
  .then(r => r.json())
  .then(d => console.log('Shopify Cart:', d));

// 5. Manual trigger Shiprocket (if loaded)
shiprocketCheckoutEvents?.buyDirect({ type: 'cart' });
```

---

## 📞 If Issues Persist

**Collect this information:**

1. Console logs from checkout attempt
2. Output of quick test commands above
3. Network tab screenshot (F12 → Network)
4. Screenshot of the redirect URL

**Send to:**
- Shiprocket developer with API keys
- They can check server-side logs

---

## 🔄 Next Deployment Cycle

If you make any changes:

1. Test locally first if possible
2. Check console for errors
3. Verify variant IDs are numeric
4. Test checkout flow
5. Only then push to production

---

*Testing after deployment of numeric variant ID extraction fix.*
