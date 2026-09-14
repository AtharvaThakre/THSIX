# THSIX - Vercel Deployment Guide

## 🚀 Deployment Steps

### 1. Pre-deployment Checklist

- ✅ All environment variables configured
- ✅ Shopify Storefront API access token is valid
- ✅ Build process optimized for production
- ✅ Real-time product updates configured

### 2. GitHub Repository Setup

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub.com](https://github.com/new)
   - Create a new repository named `THSIX`
   - **Don't** initialize with README, .gitignore, or license

3. **Push to GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/THSIX.git
   git push -u origin main
   ```

### 3. Vercel Deployment

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel

# Follow the prompts:
# ? Set up and deploy "THSIX"? Y
# ? Which scope? (Select your account)
# ? Link to existing project? N
# ? What's your project's name? THSIX
# ? In which directory is your code located? ./
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4. Environment Variables Setup

In Vercel Dashboard → Settings → Environment Variables, add:

```
VITE_SHOPIFY_STORE_DOMAIN = https://19sjnp-gx.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN = be59fa0cf086500d7b6456e64f233866
VITE_APP_TITLE = THSIX
NODE_ENV = production
```

### 5. Custom Domain Setup (Optional)

1. **Vercel Dashboard** → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## 🔄 Real-Time Shopify Updates

### Shopify Web Components Integration

Your site uses Shopify's Web Components which automatically:
- ✅ Fetch live product data on each page load
- ✅ Update prices, inventory, and variants in real-time
- ✅ Handle cart operations with live Shopify data
- ✅ Sync with your Shopify admin changes immediately

### Cache Strategy

The site uses `cache-policy="cache-first-network-fallback"` which:
- Loads fast from cache when available
- Fetches fresh data when cache expires
- Always shows latest product information

## 🏗️ Build Optimization

### Automatic Optimizations Applied:
- **Code Splitting**: Vendor, router, UI, and 3D libraries separated
- **Minification**: Terser for optimal bundle size
- **Asset Optimization**: Images and fonts optimized
- **Tree Shaking**: Unused code removed automatically

## 🔧 Maintenance & Updates

### Automatic Deployments
- Every `git push` to main branch triggers auto-deployment
- Vercel builds and deploys in ~2-3 minutes
- Zero-downtime deployments with instant rollback

### Shopify Content Updates
- Product changes in Shopify admin appear immediately
- Inventory updates reflect in real-time
- New products auto-appear in collections
- Price changes sync instantly

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**:
   ```bash
   # Check locally first
   npm run build
   ```

2. **Environment Variables Not Working**:
   - Ensure variables start with `VITE_`
   - Redeploy after adding environment variables

3. **Shopify Data Not Loading**:
   - Verify Storefront API access token
   - Check CORS settings in Shopify admin

4. **Cart Issues**:
   - Clear browser localStorage
   - Check if Shopify Web Components script loaded

### Support Commands:
```bash
# Local development
npm run dev

# Production build test
npm run build && npm run preview

# Deploy to Vercel
vercel --prod
```

## 📊 Performance Monitoring

After deployment, monitor:
- **Lighthouse Score**: Should be 90+ for all metrics
- **Vercel Analytics**: Track performance and user behavior
- **Shopify Analytics**: Monitor conversions and sales

Your THSIX headless store will be live with real-time Shopify integration! 🎉