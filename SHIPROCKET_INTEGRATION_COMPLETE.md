# Shiprocket Checkout Integration - Complete Guide

## Overview
Your THSIX website now has **Shiprocket Checkout** fully integrated using the **Shopify + Shiprocket** approach. When users click the checkout button, they will see Shiprocket's checkout interface.

## What Was Implemented

### 1. **Frontend Integration** ✅
- Added Shiprocket scripts to `index.html`
- Configured seller domain: `19sjnp-gx.myshopify.com`
- Created `src/services/shiprocket-shopify.ts` for Shiprocket functions
- Created `src/services/shopify-cart.ts` for cart synchronization
- Updated `src/components/Cart/Cart.tsx` to handle checkout flow

### 2. **How It Works**

#### User Flow:
1. User adds products to cart (managed by React context)
2. User clicks "Checkout" button
3. **System syncs React cart → Shopify cart** via AJAX API
4. **Shiprocket checkout opens** as an iframe
5. User completes purchase through Shiprocket
6. Order is created in both Shopify and Shiprocket

#### Technical Flow:
```javascript
handleCheckout()
  ↓
Wait for Shiprocket script to load
  ↓
Sync React cart items to Shopify cart
  ↓
Call shiprocketCheckoutEvents.buyDirect({ type: 'cart' })
  ↓
Shiprocket iframe opens with checkout form
```

## Files Modified/Created

### New Files:
- `src/services/shiprocket-shopify.ts` - Shiprocket integration
- `src/services/shopify-cart.ts` - Shopify cart sync
- `SHIPROCKET_INTEGRATION_COMPLETE.md` - This documentation

### Modified Files:
- `index.html` - Added Shiprocket scripts and seller domain
- `src/components/Cart/Cart.tsx` - Updated checkout handler

## Configuration Required

### 1. Environment Variables
Make sure these are set in your `.env` file and Vercel:

```env
# Shopify (already configured)
VITE_SHOPIFY_STORE_DOMAIN=https://19sjnp-gx.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=be59fa0cf086500d7b6456e64f233866

# No additional Shiprocket config needed for frontend approach!
```

### 2. Shopify Products
**IMPORTANT**: For checkout to work, your products must:
- ✅ Exist in your Shopify store
- ✅ Have valid variant IDs
- ✅ Be published and available

### 3. Shiprocket Dashboard Configuration
You need to configure this in your Shiprocket dashboard:

1. **Go to**: Shiprocket Dashboard → Settings → Checkout Settings
2. **Add your Shopify store**:
   - Store URL: `https://19sjnp-gx.myshopify.com`
   - Enable Shopify integration
3. **Configure success/failure URLs**:
   - Success URL: `https://your-domain.com/checkout/success`
   - Failure URL: `https://your-domain.com/checkout/failure`

## Testing the Integration

### Local Testing:
```bash
npm run dev
```

1. Add a product to cart
2. Click "Checkout"
3. Shiprocket iframe should open
4. Check browser console for logs:
   - "Syncing cart to Shopify..."
   - "Cart synced to Shopify successfully"
   - "Initiating Shiprocket checkout..."
   - "Shiprocket checkout initiated"

### Troubleshooting:

#### Issue: "Checkout service is not available"
**Solution**: Shiprocket script failed to load
- Check internet connection
- Check browser console for script errors
- Verify `index.html` has correct script tags

#### Issue: "Failed to prepare checkout"
**Solution**: Cart sync to Shopify failed
- Check Shopify store domain is correct
- Verify products exist in Shopify
- Check product variant IDs are valid
- Check browser console for API errors

#### Issue: Checkout button does nothing
**Solution**: Check browser console
- Look for JavaScript errors
- Verify `shiprocketCheckoutEvents` is defined
- Check if products have valid variant IDs

## Product Variant IDs

Your products need valid Shopify variant IDs. Example format:
```typescript
{
  id: "adidas-originals-1",
  variantId: "gid://shopify/ProductVariant/12345678", // Must be valid!
  quantity: 1
}
```

To find variant IDs:
1. Go to Shopify Admin → Products
2. Select a product
3. Click on a variant
4. Variant ID is in the URL or use Shopify API

## Deployment Checklist

Before deploying to production:

- [ ] All products have valid Shopify variant IDs
- [ ] Shiprocket scripts load correctly
- [ ] Checkout tested locally
- [ ] Environment variables set in Vercel
- [ ] Shiprocket dashboard configured
- [ ] Success/failure redirect pages created
- [ ] Test checkout on production URL

## Integration Approach: Why This Method?

### ✅ Chosen: Shopify + Shiprocket Frontend Approach
**Pros:**
- Simple 6-line integration
- No backend API needed
- Direct Shopify integration
- Maintained by Shiprocket team
- Automatic updates

**Cons:**
- Less customization
- Depends on Shopify's cart
- Requires products in Shopify

### ❌ Alternative: Custom API Approach
We built a complete custom API in `/api/*` but chose NOT to use it because:
- More complex to maintain
- Requires backend authentication
- More points of failure
- Document recommended the simple approach

The custom API code is still available in `/api/*` if you need it later.

## Next Steps

### Immediate:
1. ✅ Integration complete
2. ⏳ Test locally
3. ⏳ Deploy to Vercel
4. ⏳ Configure Shiprocket dashboard
5. ⏳ Test on production

### Future Enhancements:
- Create success/failure pages
- Add order tracking
- Integrate with Shopify webhooks
- Add abandoned cart recovery
- Implement coupon codes

## Support

### If checkout doesn't work:
1. Check browser console for errors
2. Verify Shopify products exist
3. Check Shiprocket dashboard is configured
4. Contact Shiprocket support: support@shiprocket.com

### If you need custom API instead:
The custom API integration is already built in `/api/*`:
- `/api/catalog/products.ts` - Get products
- `/api/catalog/collections.ts` - Get collections
- `/api/checkout/access-token.ts` - Generate checkout token
- `/api/webhooks/order.ts` - Handle order webhooks

Refer to `API_ENDPOINTS.md` for documentation.

## Code Examples

### Add Product to Cart:
```typescript
import { useCart } from '@/contexts/CartContext';

const { addItem } = useCart();

addItem({
  id: 'product-id',
  variantId: 'gid://shopify/ProductVariant/12345',
  title: 'Product Name',
  price: 2999,
  quantity: 1,
  image: '/path/to/image.jpg'
});
```

### Trigger Checkout:
```typescript
import { checkoutFromCart } from '@/services/shiprocket-shopify';

// Cart is automatically synced and checkout opens
checkoutFromCart();
```

### Buy Now (Direct Checkout):
```typescript
import { checkoutWithProducts } from '@/services/shiprocket-shopify';

checkoutWithProducts([
  {
    variantId: 'gid://shopify/ProductVariant/12345',
    quantity: 1
  }
]);
```

## Conclusion

Your Shiprocket integration is complete! The checkout flow is:
1. User clicks checkout
2. Cart syncs to Shopify
3. Shiprocket iframe opens
4. User completes purchase

**Remember**: Test thoroughly before going live!
