# 🧪 Shiprocket Checkout - Testing Checklist

## 🚀 **Your Dev Server is Running!**

Access your site at: **http://localhost:5173/**

---

## ⚠️ **CRITICAL: What You Need Before Testing**

### 🔴 **Missing: Shopify Product Variant IDs**

Your products currently DON'T have Shopify variant IDs, which are REQUIRED for checkout to work.

**Current product data:**
```typescript
// ❌ Missing variantId
{
  id: "samba-og-cloud-white-core-black",
  title: "Samba OG",
  price: 10999,
  // NO variantId field!
}
```

**What you NEED:**
```typescript
// ✅ With variantId
{
  id: "samba-og-cloud-white-core-black",
  variantId: "gid://shopify/ProductVariant/12345678901234", // ← THIS!
  title: "Samba OG",
  price: 10999,
}
```

---

## 📋 **Two Testing Approaches**

### **Approach 1: Visual Testing (Without Variant IDs)**

Test that the UI and scripts work:

1. ✅ Open http://localhost:5173/
2. ✅ Navigate around the site
3. ✅ Check browser console (F12) for errors
4. ✅ Verify Shiprocket script loaded

**In Console, type:**
```javascript
window.shiprocketCheckoutEvents
```

**Expected Result:** Should show an object, not `undefined`

### **Approach 2: Full Checkout Testing (Requires Variant IDs)**

Test the complete checkout flow:

**Prerequisites:**
1. Get variant IDs from Shopify (see below)
2. Update product data
3. Test checkout

---

## 🔑 **How to Get Shopify Variant IDs**

### Method 1: Ask Your Developer Team (EASIEST)

**Send them this:**
```
Hi team,

I need Shopify variant IDs for our products to complete the checkout integration.

For each product (like Samba OG), I need the variant ID in this format:
gid://shopify/ProductVariant/12345678901234

Can you provide variant IDs for:
1. Samba OG - Cloud White / Core Black
2. Samba OG - Core Black / White
3. Samba OG - Off White / Green
4. Samba OG - White / Grey

Thanks!
```

### Method 2: From Shopify Admin (DO IT YOURSELF)

1. Go to: https://19sjnp-gx.myshopify.com/admin/products
2. Click on a product
3. Click on a variant (e.g., "Size 8" or "Cloud White")
4. Look at the URL:
   ```
   https://19sjnp-gx.myshopify.com/admin/variants/48123456789012
                                                    ↑ This is your variant ID
   ```
5. Format it as: `gid://shopify/ProductVariant/48123456789012`

### Method 3: Use Shopify GraphQL Explorer

1. Go to: https://19sjnp-gx.myshopify.com/admin/api/graphiql.json
2. Paste this query:
```graphql
{
  products(first: 10) {
    edges {
      node {
        title
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
  }
}
```
3. Copy the variant IDs from the response

---

## ✅ **Quick Visual Test (Do This Now)**

### Test 1: Site Loads
- [ ] Open http://localhost:5173/
- [ ] Page loads without errors
- [ ] Images appear correctly
- [ ] Navigation works

### Test 2: Shiprocket Script
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Type: `window.shiprocketCheckoutEvents`
- [ ] Should see: `{buyDirect: ƒ, ...}` (not undefined)

### Test 3: Seller Domain
- [ ] In Console, type: `document.getElementById('sellerDomain').value`
- [ ] Should see: `19sjnp-gx.myshopify.com`

### Test 4: Add to Cart
- [ ] Click on a product
- [ ] Click "Add to Cart"
- [ ] Cart icon shows count
- [ ] Open cart panel
- [ ] Product appears in cart

### Test 5: Cart Functionality
- [ ] Increase quantity
- [ ] Decrease quantity
- [ ] Remove item
- [ ] Add multiple products
- [ ] All calculations correct

### Test 6: Checkout Button Visibility
- [ ] With items in cart, checkout button appears
- [ ] Shows correct total price
- [ ] Button is not disabled

---

## 🧪 **Full Checkout Test (After You Get Variant IDs)**

### Step 1: Update Product Data

Edit `src/data/products.ts`:

```typescript
export const sambaProducts: Product[] = [
  {
    id: "samba-og-cloud-white-core-black",
    variantId: "gid://shopify/ProductVariant/YOUR_REAL_ID_HERE", // ← ADD THIS
    title: "Samba OG",
    color: "Cloud White / Core Black",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  },
  // ... update all products
];
```

### Step 2: Update Type Definition

Edit `src/types/product.ts` to include `variantId`:

```typescript
export interface Product {
  id: string;
  variantId?: string; // ← ADD THIS
  title: string;
  color?: string;
  price: number;
  currency: string;
  image: string | null;
  available: boolean;
}
```

### Step 3: Test Checkout Flow

1. [ ] Add product to cart
2. [ ] Open cart panel
3. [ ] Click "Checkout" button
4. [ ] Watch browser console for logs:
   ```
   Syncing cart to Shopify...
   Cart synced to Shopify successfully
   Initiating Shiprocket checkout...
   ```
5. [ ] Shiprocket iframe should open
6. [ ] Should show your products
7. [ ] Should have checkout form

### Success Criteria:
✅ No errors in console
✅ Iframe opens smoothly
✅ Products displayed correctly
✅ Prices match your cart
✅ Can fill out form

---

## 🐛 **Troubleshooting Guide**

### Issue: "Cannot read property 'buyDirect' of undefined"
**Cause:** Shiprocket script not loaded
**Fix:**
1. Check internet connection
2. Reload page (Ctrl + R)
3. Clear cache (Ctrl + Shift + R)
4. Check Network tab for failed script request

### Issue: "Failed to prepare checkout"
**Cause:** Cart sync to Shopify failed
**Fix:**
1. Check if products have variantId
2. Verify Shopify store domain in .env
3. Check browser console for API errors
4. Ensure Shopify Storefront API is enabled

### Issue: Checkout button does nothing
**Cause:** Missing variant IDs or script error
**Fix:**
1. Open console and look for errors
2. Verify `window.shiprocketCheckoutEvents` exists
3. Check if products have variantId
4. Test with browser DevTools Network tab open

### Issue: Iframe opens but is blank
**Cause:** Shiprocket dashboard not configured
**Fix:**
1. Configure Shiprocket dashboard
2. Add your Shopify store URL
3. Enable checkout feature
4. Contact Shiprocket support if needed

---

## 📸 **What to Look For**

### Console Logs (Success):
```
[Shiprocket] Script loaded
Syncing cart to Shopify...
POST https://19sjnp-gx.myshopify.com/cart/clear.js 200 OK
POST https://19sjnp-gx.myshopify.com/cart/add.js 200 OK
Cart synced to Shopify successfully
Initiating Shiprocket checkout...
Shiprocket checkout initiated: {type: "cart"}
```

### Visual Indicators (Success):
- Modal/iframe appears with animation
- Shiprocket branding visible
- Your products listed with images
- Checkout form visible
- Price matches your cart total

---

## 📊 **Test Results Template**

Copy this and fill it out:

```
## Test Results - [Date]

### Environment:
- Browser: [Chrome/Firefox/Safari]
- URL: http://localhost:5173/

### Test 1: Site Loading
- Status: [ ] Pass [ ] Fail
- Notes:

### Test 2: Shiprocket Script
- window.shiprocketCheckoutEvents: [ ] Loaded [ ] Not Loaded
- Notes:

### Test 3: Add to Cart
- Status: [ ] Pass [ ] Fail
- Notes:

### Test 4: Cart Functionality
- Status: [ ] Pass [ ] Fail
- Notes:

### Test 5: Checkout Button
- Status: [ ] Pass [ ] Fail
- Console Errors:
- Notes:

### Issues Found:
1.
2.
3.

### Screenshots:
[Attach screenshots of any issues]
```

---

## 🎯 **Your Current Status**

✅ **Working:**
- Dev server running
- Site accessible
- Build successful
- Integration code complete

⏳ **Pending:**
- Get Shopify variant IDs
- Update product data
- Test full checkout flow
- Configure Shiprocket dashboard

🔴 **Blockers:**
- No Shopify variant IDs in product data
- Can't test full checkout without them

---

## 📞 **What to Ask Your Team**

**Right Now:**

1. **"Can you provide Shopify variant IDs for our products?"**
   - Needed for checkout to work
   - Format: `gid://shopify/ProductVariant/12345678901234`

2. **"Do we have access to Shiprocket dashboard?"**
   - Need to configure checkout settings
   - Need redirect URLs

3. **"Are our products already in Shopify?"**
   - Need to verify products exist
   - Need to confirm they're published

---

## 🚀 **Next Steps**

### Today:
1. ✅ Visual testing (you can do this now!)
2. ⏳ Get variant IDs from your team
3. ⏳ Update product data

### Tomorrow:
1. Test full checkout flow
2. Fix any issues found
3. Deploy to production

### This Week:
1. Configure Shiprocket dashboard
2. Create success/failure pages
3. Monitor first real orders

---

## 💡 **Quick Commands**

### See what's running:
```bash
# Site is at: http://localhost:5173/
```

### Open in browser:
- Windows: `start http://localhost:5173/`
- Mac: `open http://localhost:5173/`

### Stop dev server:
- Press `Ctrl + C` in terminal

### Check for errors:
- F12 → Console tab

---

**Start testing now!** Open http://localhost:5173/ and follow the Quick Visual Test checklist above!
