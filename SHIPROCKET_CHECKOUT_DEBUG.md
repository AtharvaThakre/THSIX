# Shiprocket Checkout Debugging Guide

## Issue: Checkout redirects to Shopify cart instead of opening Shiprocket modal

### What Was Fixed

1. **Seller Domain**: Changed from `19sjnp-gx.myshopify.com` to `thsix.com`
2. **Variant ID Format**: Now properly extracts numeric IDs from Shopify's global IDs
3. **Cart Sync**: Improved clearing and repopulating Shopify cart
4. **Error Logging**: Added detailed console logs for debugging

### Testing After Deployment

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Add item to cart**
4. **Click Checkout button**
5. **Watch console logs**

### Expected Console Output

```
Starting checkout process...
Cart items: [Array of items with variantId]
Loading Shiprocket integration...
Waiting for Shiprocket to be ready...
Shiprocket is ready
Syncing cart to Shopify...
Shopify cart cleared
Prepared Shopify cart items: [Array with numeric IDs]
Cart synced to Shopify successfully: {Object}
Cart synced successfully
Initiating Shiprocket checkout...
Shiprocket checkout params: {type: "cart"}
Shiprocket checkout initiated successfully
Checkout initiated - Shiprocket modal should appear
```

### Debugging Checklist

#### 1. Check if Shiprocket Script Loaded

In browser console, type:
```javascript
shiprocketCheckoutEvents
```

**Expected:** Should show an object with `buyDirect` function  
**If undefined:** Script didn't load - check network tab for blocked requests

#### 2. Check Seller Domain

In browser console, type:
```javascript
document.getElementById('sellerDomain').value
```

**Expected:** `"thsix.com"`  
**If wrong:** Clear cache and hard reload (Ctrl+Shift+R)

#### 3. Check Cart Items Have Variant IDs

In browser console after adding to cart:
```javascript
JSON.parse(localStorage.getItem('thsix_cart'))
```

**Expected:** Each item should have `variantId` property  
**If missing:** The product page isn't passing variant IDs correctly

#### 4. Check Shopify Cart

In browser console:
```javascript
fetch('https://19sjnp-gx.myshopify.com/cart.js')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Should show cart items after sync  
**If empty:** Cart sync failed

#### 5. Check Network Requests

Open DevTools → Network tab:
- Filter by "pickrr" or "shiprocket"
- Look for:
  - ✅ `shopify.js` - Should load successfully (200 OK)
  - ✅ `shopify.css` - Should load successfully (200 OK)
  - ✅ Shopify `/cart/clear.js` - Should return 200
  - ✅ Shopify `/cart/add.js` - Should return 200

### Common Issues & Solutions

#### Issue: "shiprocketCheckoutEvents is not defined"

**Cause:** Script didn't load or load in time  
**Solution:**
1. Check if ad blocker is blocking Pickrr domain
2. Disable ad blockers temporarily
3. Check Network tab for 404/403 errors
4. Wait longer (script is deferred)

#### Issue: Redirects to Shopify Cart

**Cause 1:** Shiprocket not properly initialized  
**Solution:** Check console for "Shiprocket is ready" message

**Cause 2:** Seller domain is wrong  
**Solution:** Verify `sellerDomain` input value is `thsix.com`

**Cause 3:** API keys not set in Vercel  
**Solution:** Add `SHIPROCKET_API_KEY` and `SHIPROCKET_API_SECRET` in Vercel

#### Issue: Variant IDs are wrong format

**Cause:** Product pages passing string size instead of variant ID  
**Solution:** Check `ProductDetailPage.tsx` - ensure it passes numeric variant ID

#### Issue: Cart items missing variantId

**Cause:** AddToCartButton not receiving variant ID  
**Solution:** Check where AddToCartButton is used - ensure `variantId` prop is passed

### Manual Testing Steps

1. **Clear Everything**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
   Then hard reload (Ctrl+Shift+R)

2. **Add Product to Cart**:
   - Select a size
   - Click "Add to Cart"
   - Open cart
   - Verify item shows with size

3. **Check Console**:
   ```javascript
   // Should show object
   shiprocketCheckoutEvents
   
   // Should show thsix.com
   document.getElementById('sellerDomain').value
   
   // Should show items with variantId
   JSON.parse(localStorage.getItem('thsix_cart'))
   ```

4. **Click Checkout**:
   - Watch console for detailed logs
   - Shiprocket modal should open
   - If redirects to Shopify, check what console says

### If Still Redirecting to Shopify

**Step 1:** Contact Shiprocket Developer
Provide them with:
- Seller domain: `thsix.com`
- API Key: `93B0a2SK2S9srY1N`
- Console logs from checkout attempt
- Network tab screenshot

**Step 2:** Verify API Keys in Vercel
- Go to Vercel Dashboard
- Check Environment Variables
- Ensure both keys are set for Production
- Redeploy if you just added them

**Step 3:** Test Script Directly
In console, manually trigger checkout:
```javascript
shiprocketCheckoutEvents.buyDirect({
  type: "cart"
});
```

If this works but button doesn't, the issue is in our code.  
If this also redirects, the issue is with Shiprocket setup.

### Production Checklist

Before considering it "production ready":

- [ ] Shiprocket modal opens (not Shopify redirect)
- [ ] All cart items appear in Shiprocket checkout
- [ ] Can fill shipping details
- [ ] Can select payment method
- [ ] Can complete test order
- [ ] Success page shows correct order details
- [ ] Cart clears after successful order
- [ ] Failed payment returns to cart with items intact

### Support Contacts

**Shiprocket Developer:**
- They generated your API keys
- They can verify your domain is properly configured
- They can check server-side logs

**What to Send Them:**
1. Console logs from checkout attempt
2. Network tab showing Pickrr script loading
3. Value of `document.getElementById('sellerDomain')`
4. Confirmation API keys are set in Vercel

### Quick Fixes

**Fix 1: Hard Reload**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**Fix 2: Clear Cache**
DevTools → Application → Clear Storage → Clear site data

**Fix 3: Disable Extensions**
Open in Incognito/Private mode to test without extensions

**Fix 4: Check Vercel Logs**
Vercel Dashboard → Deployments → Click latest → View Function Logs

---

## Environment Variables Verification

Ensure these are set in Vercel:

```
SHIPROCKET_API_KEY=93B0a2SK2S9srY1N
SHIPROCKET_API_SECRET=4slCXvmTfW3CKWwhYiMQCu0ngIIOZ6fN
SHIPROCKET_BASE_URL=https://checkout-api.shiprocket.com
WEBSITE_BASE_URL=https://thsix.com
```

Check by visiting: `https://thsix.com/api/hello`  
Should not show any errors about missing env vars.

---

*Last Updated: After fixing sellerDomain and variant ID handling*
