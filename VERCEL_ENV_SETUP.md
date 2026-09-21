# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- Select your project: **THSIX**
- Go to: **Settings** → **Environment Variables**

### 2. Add Shopify Variables

Add these **two** environment variables:

#### Variable 1: SHOPIFY_STORE_DOMAIN
```
Name: SHOPIFY_STORE_DOMAIN
Value: https://19sjnp-gx.myshopify.com
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: SHOPIFY_STOREFRONT_ACCESS_TOKEN
```
Name: SHOPIFY_STOREFRONT_ACCESS_TOKEN
Value: be59fa0cf086500d7b6456e64f233866
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3. Redeploy

After adding environment variables, trigger a new deployment:
- Option 1: Push a new commit
- Option 2: Go to **Deployments** → Click ⋯ on latest → **Redeploy**

---

## Optional: Shiprocket Variables (Add later when provided)

```
Name: SHIPROCKET_API_KEY
Value: <will be provided by Shiprocket team>
Environments: ✅ Production

Name: SHIPROCKET_API_SECRET
Value: <will be provided by Shiprocket team>
Environments: ✅ Production
```

---

## Verification

Once deployed, test with:

```bash
curl https://thsix.vercel.app/api/catalog/products
```

You should see your 6 real Adidas products from Shopify!
