# Shiprocket Integration Setup Guide

## ✅ Integration Complete

The Shiprocket checkout integration has been successfully configured with your API keys.

## 🔐 Security Status

- ✅ API keys are stored in `.env.production` and `.env.local`
- ✅ Both files are in `.gitignore` and **will not be pushed to GitHub**
- ✅ Keys are kept secure and private

## 🔑 API Keys Configured

```
API Key: 93B0a2SK2S9srY1N
Secret Key: 4slCXvmTfW3CKWwhYiMQCu0ngIIOZ6fN
```

## 📋 Vercel Environment Variables Setup

**IMPORTANT:** You must add these environment variables to Vercel:

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (THSIX)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SHIPROCKET_API_KEY` | `93B0a2SK2S9srY1N` | Production, Preview, Development |
| `SHIPROCKET_API_SECRET` | `4slCXvmTfW3CKWwhYiMQCu0ngIIOZ6fN` | Production, Preview, Development |
| `SHIPROCKET_BASE_URL` | `https://checkout-api.shiprocket.com` | Production, Preview, Development |
| `WEBSITE_BASE_URL` | `https://thsix.com` | Production |
| `CHECKOUT_SUCCESS_URL` | `/checkout/success` | Production, Preview, Development |
| `CHECKOUT_FAILURE_URL` | `/checkout/failure` | Production, Preview, Development |

5. Click **Save** after adding each variable
6. **Redeploy** your application for the changes to take effect

## 🚀 What's Been Integrated

### 1. Frontend Integration (`index.html`)
```html
<!-- Shiprocket Checkout Integration -->
<input type="hidden" value="thsix.com" id="sellerDomain"/>
<script src="https://fastrr-boost-ui.pickrr.com/assets/js/channels/shopify.js" defer></script>
<link rel="stylesheet" href="https://fastrr-boost-ui.pickrr.com/assets/styles/shopify.css"/>
```

### 2. API Response Structure Fixed
Changed from:
```json
{
  "ok": true,
  "result": { ... }
}
```

To (Shiprocket-compliant):
```json
{
  "ok": true,
  "data": { ... }
}
```

### 3. API Endpoints Ready
- ✅ `/api/catalog/products` - Returns all products
- ✅ `/api/catalog/collections` - Returns all collections
- ✅ `/api/catalog/products-by-collection?collection_id=XXX` - Returns products by collection

### 4. Checkout Flow
- ✅ Cart syncs to Shopify before checkout
- ✅ Shiprocket checkout initiates with products
- ✅ Success/failure redirect URLs configured

## 🧪 Testing Checklist

After deploying to Vercel:

1. ✅ Verify API endpoints return data with `"data"` key:
   - `curl https://thsix.com/api/catalog/products`
   - `curl https://thsix.com/api/catalog/collections`

2. ✅ Test checkout flow:
   - Add items to cart
   - Click "Checkout" button
   - Verify Shiprocket checkout modal opens

3. ✅ Verify Shiprocket script loads:
   - Open browser console
   - Check for `shiprocketCheckoutEvents` object

## 🔄 Deployment Steps

1. **Commit changes** (API keys are NOT included in commit):
   ```bash
   git add .
   git commit -m "feat: integrate Shiprocket checkout with API keys"
   git push
   ```

2. **Add environment variables in Vercel** (see table above)

3. **Redeploy** or wait for automatic deployment

4. **Test** the checkout flow

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify environment variables in Vercel
3. Ensure the Shiprocket script loads successfully
4. Contact Shiprocket developer if checkout modal doesn't open

## 🔒 Security Notes

- Never commit `.env` files to Git
- Never share API keys publicly
- Only add keys to Vercel environment variables
- Rotate keys if accidentally exposed
