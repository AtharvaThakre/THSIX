# Shiprocket Integration - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### 1. Get API Credentials from Shiprocket
Contact Shiprocket team and request:
- API Key
- API Secret

### 2. Add Environment Variables in Vercel
```
SHIPROCKET_API_KEY=<from-shiprocket>
SHIPROCKET_API_SECRET=<from-shiprocket>
SHIPROCKET_BASE_URL=https://checkout-api.shiprocket.com
WEBSITE_BASE_URL=https://thsix.com
```

### 3. Share These URLs with Shiprocket Team

**Catalog APIs** (they will call these):
```
GET https://thsix.com/api/catalog/products?page=1&limit=100
GET https://thsix.com/api/catalog/collections?page=1&limit=100
GET https://thsix.com/api/catalog/products-by-collection?collection_id=<id>&page=1&limit=100
```

**Webhook URL** (configure in their dashboard):
```
POST https://thsix.com/api/webhooks/order
```

### 4. Update Product Data
Edit `api/lib/data-service.ts` and replace mock data with your actual products.

### 5. Test & Deploy
```bash
# Test locally
npm run dev

# Deploy to production
git push origin main  # (auto-deploys on Vercel)
```

---

## 🧪 Testing Your Integration

### Test Checkout Flow
1. Add items to cart on your website
2. Click "Checkout" button
3. Complete payment in Shiprocket iframe
4. Verify redirect to success page
5. Check Vercel logs for webhook receipt

### Test API Endpoints
```bash
# Products
curl https://thsix.com/api/catalog/products

# Collections  
curl https://thsix.com/api/catalog/collections

# Products by collection
curl https://thsix.com/api/catalog/products-by-collection?collection_id=adidas-collection
```

---

## 📋 Your API Endpoints Summary

### Frontend Calls (From Browser)
- `POST /api/checkout/access-token` - Generate checkout token
- `POST /api/checkout/order-details` - Fetch order details

### Shiprocket Calls (From Their Servers)
- `GET /api/catalog/products` - Fetch your products
- `GET /api/catalog/collections` - Fetch your collections
- `GET /api/catalog/products-by-collection` - Fetch products in a collection
- `POST /api/webhooks/order` - Receive order notifications

### You Call Shiprocket (Optional - for real-time sync)
- `POST /api/webhooks/product-update` - Sync product to Shiprocket
- `POST /api/webhooks/collection-update` - Sync collection to Shiprocket

---

## ⚠️ Important Notes

### Security
- Never expose API credentials in frontend code
- Environment variables starting with `VITE_` are exposed to browser
- Shiprocket credentials should NOT have `VITE_` prefix

### Variant IDs
- Make sure your products have unique variant IDs
- These IDs must match what's in the cart: `item.variantId || item.id`
- Shiprocket needs these to process orders correctly

### HMAC Authentication
- All webhook requests are authenticated with HMAC SHA256
- This is handled automatically by the integration
- Don't modify the authentication logic unless necessary

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Checkout button does nothing | Check browser console for errors; verify environment variables |
| "Failed to generate token" | Check Vercel function logs; verify API credentials are correct |
| Products not showing in Shiprocket | Verify catalog APIs are returning correct data format |
| Webhook not receiving orders | Check webhook URL in Shiprocket dashboard; verify authentication |

---

## 📞 Need Help?

1. Check detailed guide: `SHIPROCKET_INTEGRATION.md`
2. Review Vercel function logs for errors
3. Contact Shiprocket support: support@shiprocket.com
4. Check API documentation: https://documenter.getpostman.com/view/25617008/2sB34bL3ig

---

## ✅ Checklist

**Before Going Live:**
- [ ] Environment variables configured in Vercel
- [ ] API credentials from Shiprocket received
- [ ] Catalog endpoints registered with Shiprocket
- [ ] Webhook URL configured
- [ ] Real product data loaded (not mock data)
- [ ] Test checkout completed successfully
- [ ] Order webhook received and processed
- [ ] Email notifications working

**Done!** Your Shiprocket integration is live! 🎉
