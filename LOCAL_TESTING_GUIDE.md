# Local Testing Guide - Shiprocket Checkout

## ⚠️ **IMPORTANT: Prerequisites**

Before testing checkout, you MUST have:

### 1. **Products in Shopify Store**
Your products need to exist in your Shopify store with valid variant IDs.

**Current Issue:** Your `src/data/products.ts` has products but NO Shopify variant IDs.

**Example of what you need:**
```typescript
{
  id: "samba-og-cloud-white-core-black",
  variantId: "gid://shopify/ProductVariant/12345678901234", // ← THIS IS MISSING!
  title: "Samba OG",
  // ... other fields
}
```

### 2. **How to Get Variant IDs:**

#### Option A: Use Shopify Admin
1. Go to your Shopify admin: https://19sjnp-gx.myshopify.com/admin
2. Go to Products
3. Click on a product
4. Click on a variant
5. Look at the URL: `...variants/12345678901234`
6. Full variant ID format: `gid://shopify/ProductVariant/12345678901234`

#### Option B: Use Shopify GraphQL API
```graphql
query {
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

#### Option C: Ask Your Developer Team
They should provide you with:
- Product IDs from Shopify
- Variant IDs for each product option

---

## 🧪 **Step-by-Step Local Testing**

### Step 1: Start Development Server

```bash
npm run dev
```

The site should open at `http://localhost:5173`

### Step 2: Check Shiprocket Script Loading

1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `window.shiprocketCheckoutEvents`
4. You should see an object with functions

**If it shows `undefined`:**
- Shiprocket script failed to load
- Check Network tab for failed requests
- Check if you have internet connection

### Step 3: Add Product to Cart

1. Navigate to products section
2. Click "Add to Cart" on any product
3. Cart icon should show item count
4. Open cart panel

**Expected Result:**
- Product appears in cart
- Quantity controls work
- Price calculates correctly

### Step 4: Test Checkout Button (Will Fail Without Variant IDs)

1. Click "Checkout" button in cart
2. Open browser console (F12)
3. Watch for messages

**Expected Messages:**
```
Syncing cart to Shopify...
Cart synced to Shopify successfully
Initiating Shiprocket checkout...
Shiprocket checkout initiated: {type: 'cart'}
```

**Possible Errors:**

#### Error: "Checkout service is not available"
**Cause:** Shiprocket script not loaded
**Solution:** 
- Check internet connection
- Clear browser cache
- Reload page

#### Error: "Failed to prepare checkout"
**Cause:** Cart sync to Shopify failed
**Solution:**
- Check if products have variant IDs
- Check Shopify store is accessible
- Check browser console for API errors

#### Error: Checkout button does nothing
**Cause:** Missing variant IDs or Shopify connection issue
**Solution:**
- Add variant IDs to products
- Verify Shopify store domain is correct

---

## 🔧 **Temporary Test Setup (Without Real Products)**

For initial testing without setting up all products:

### Create a Test Product with Dummy Variant ID:

Edit `src/data/products.ts`:

```typescript
export const sambaProducts: Product[] = [
  {
    id: "samba-og-cloud-white-core-black",
    variantId: "gid://shopify/ProductVariant/12345678901234", // Add this
    title: "Samba OG",
    color: "Cloud White / Core Black",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  },
  // ... rest of products
];
```

**Note:** This will let you test the checkout flow, but the actual purchase won't work until you use real variant IDs from your Shopify store.

---

## 🐛 **Debugging Checklist**

### Check 1: Shiprocket Script
```javascript
// In browser console
console.log(window.shiprocketCheckoutEvents);
// Should show: {buyDirect: ƒ, ...}
```

### Check 2: Seller Domain
```javascript
// In browser console
console.log(document.getElementById('sellerDomain').value);
// Should show: 19sjnp-gx.myshopify.com
```

### Check 3: Shopify Store Domain
```javascript
// In browser console
console.log(import.meta.env.VITE_SHOPIFY_STORE_DOMAIN);
// Should show: https://19sjnp-gx.myshopify.com
```

### Check 4: Cart Items
```javascript
// In browser console (when cart has items)
console.log(JSON.stringify(cartItems, null, 2));
// Should show cart items with variantId
```

### Check 5: Network Requests
1. Open DevTools → Network tab
2. Filter: XHR
3. Click checkout
4. Look for requests to:
   - `19sjnp-gx.myshopify.com/cart/clear.js`
   - `19sjnp-gx.myshopify.com/cart/add.js`

---

## 📋 **Testing Scenarios**

### Scenario 1: Basic Checkout Flow
1. ✓ Add product to cart
2. ✓ Open cart
3. ✓ Click checkout
4. ✓ Shiprocket iframe appears
5. ✓ Can enter details in iframe

### Scenario 2: Multiple Products
1. ✓ Add 2-3 products to cart
2. ✓ Update quantities
3. ✓ Click checkout
4. ✓ All products appear in Shiprocket checkout

### Scenario 3: Error Handling
1. ✓ Disconnect internet
2. ✓ Try checkout
3. ✓ Error message appears
4. ✓ Reconnect and try again

### Scenario 4: Cart Modifications
1. ✓ Add products
2. ✓ Remove one product
3. ✓ Change quantity
4. ✓ Click checkout
5. ✓ Correct items in Shiprocket

---

## 🎯 **What Success Looks Like**

### Console Logs (Success):
```
Syncing cart to Shopify...
Cart synced to Shopify successfully
Initiating Shiprocket checkout...
Shiprocket checkout initiated: {type: "cart"}
```

### Visual (Success):
1. Shiprocket iframe modal appears
2. Shows your products with correct prices
3. Has checkout form (name, address, payment)
4. Branded with your store info

### If You See This - SUCCESS! 🎉

---

## ❌ **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Checkout button disabled | No items in cart | Add products to cart |
| "Service not available" | Script not loaded | Check internet, reload page |
| "Failed to prepare" | No variant IDs | Add Shopify variant IDs |
| Iframe doesn't open | Products not in Shopify | Add products to Shopify first |
| Wrong products shown | Cart sync failed | Check console for errors |
| Blank iframe | Shiprocket not configured | Configure Shiprocket dashboard |

---

## 📞 **Need Help?**

### Before Asking for Help, Check:
1. ✓ Browser console for errors
2. ✓ Network tab for failed requests
3. ✓ Shiprocket script loaded
4. ✓ Products have variant IDs
5. ✓ Internet connection working

### Information to Provide:
- Browser console logs
- Network errors (if any)
- Screenshot of the issue
- Steps to reproduce

---

## 🚀 **Next Steps After Successful Local Test**

1. **Get Real Variant IDs:**
   - From your Shopify store
   - Update all products

2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add Shiprocket checkout"
   git push origin main
   ```

3. **Configure Shiprocket Dashboard:**
   - Add redirect URLs
   - Test on production

4. **Create Success/Failure Pages:**
   - Better user experience
   - Order confirmation

---

## 🎓 **Understanding the Flow**

```
User Action: Click "Checkout"
     ↓
Your Code: checkoutFromCart()
     ↓
Step 1: Wait for Shiprocket script (waitForShiprocket)
     ↓
Step 2: Sync cart to Shopify (syncCartToShopify)
     ↓
  → Clear Shopify cart
  → Add items from React cart
     ↓
Step 3: Call Shiprocket (shiprocketCheckoutEvents.buyDirect)
     ↓
Shiprocket: Opens iframe with checkout
     ↓
User: Completes purchase
     ↓
Shiprocket: Processes payment
     ↓
Result: Order created in Shopify + Shiprocket
```

---

**Ready to test?** Start the dev server and follow the steps above!
