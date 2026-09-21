# THSIX - Deployment Guide

## Quick Deploy to Vercel

### 1. Push Changes to GitHub
```bash
git add .
git commit -m "Complete Shiprocket checkout integration"
git push origin main
```

### 2. Vercel Will Auto-Deploy
Your site is connected to Vercel, so it will automatically deploy when you push.

### 3. Verify Environment Variables
Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SHOPIFY_STORE_DOMAIN=https://19sjnp-gx.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=be59fa0cf086500d7b6456e64f233866
```

## Post-Deployment Checklist

### Immediate Testing:
1. Visit your deployed site
2. Add a product to cart
3. Click checkout button
4. Verify Shiprocket iframe opens

### Shiprocket Dashboard Setup:
1. Login to Shiprocket dashboard
2. Go to Settings → Checkout Settings
3. Add your Shopify store URL
4. Configure redirect URLs:
   - Success: `https://your-domain.vercel.app/checkout/success`
   - Failure: `https://your-domain.vercel.app/checkout/failure`

### Create Success/Failure Pages (Optional):
Create these pages for better user experience:
- `src/pages/CheckoutSuccess.tsx`
- `src/pages/CheckoutFailure.tsx`

## Troubleshooting Deployment

### Build Fails:
- Check for TypeScript errors: `npm run build`
- Review Vercel build logs
- Ensure all imports are correct

### Checkout Not Working:
1. Check browser console for errors
2. Verify Shiprocket script loads
3. Confirm products have valid Shopify variant IDs
4. Test Shopify API connection

### Images Not Loading:
- Clear browser cache
- Check image paths in `public/assets/`
- Verify cache-busting query strings

## Manual Deployment (if needed)

If automatic deployment doesn't work:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Production URLs

After deployment, update these:
- Shiprocket dashboard redirect URLs
- Any hardcoded URLs in code
- Social media links
- Meta tags

## Performance Optimization

Already implemented:
- ✅ Cache-busting for images
- ✅ Lazy loading components
- ✅ Optimized build output
- ✅ Async script loading for Shiprocket

## Monitoring

After deployment, monitor:
- Checkout conversion rate
- Error logs in browser console
- Vercel function logs
- Shiprocket order dashboard

## Support Contacts

- Vercel Support: https://vercel.com/support
- Shopify Support: https://help.shopify.com
- Shiprocket Support: support@shiprocket.com

## Rollback Plan

If something breaks:

1. **Immediate**: Revert in Vercel dashboard
   - Go to Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Git**: Revert commit
   ```bash
   git revert HEAD
   git push origin main
   ```

## Next Steps After Deployment

1. Test all features thoroughly
2. Set up analytics (Google Analytics, etc.)
3. Monitor error tracking (Sentry)
4. Configure custom domain
5. Enable HTTPS (automatic on Vercel)
6. Set up email notifications
7. Add favicon and meta tags
8. Configure SEO settings

## Current Status

✅ **Ready to Deploy**
- All code changes complete
- Build passes successfully
- Integration tested locally
- Documentation complete

**Deploy now with:**
```bash
git add .
git commit -m "Shiprocket integration complete"
git push origin main
```
