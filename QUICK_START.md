# THSIX - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Deploy to Vercel
```bash
git add .
git commit -m "Complete Shiprocket checkout integration"
git push origin main
```
**Result:** Vercel automatically deploys your site

### Step 2: Configure Shiprocket Dashboard
1. Login to Shiprocket dashboard
2. Go to **Settings → Checkout Settings**
3. Add Shopify store: `https://19sjnp-gx.myshopify.com`
4. Set redirect URLs:
   - Success: `https://your-domain.vercel.app/checkout/success`
   - Failure: `https://your-domain.vercel.app/checkout/failure`

### Step 3: Test Checkout
1. Visit your live site
2. Add a product to cart
3. Click "Checkout" button
4. Shiprocket iframe should open

**Done!** 🎉

---

## 📖 What's Inside

This project has:
- ✅ Shiprocket checkout integration
- ✅ Shopify product catalog
- ✅ Custom cart system
- ✅ Responsive design
- ✅ Image optimization

---

## 🧰 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Important Files

### Integration Files:
- `src/services/shiprocket-shopify.ts` - Shiprocket functions
- `src/services/shopify-cart.ts` - Cart sync
- `src/components/Cart/Cart.tsx` - Checkout handler

### Configuration:
- `index.html` - Shiprocket scripts
- `.env` - Environment variables

### Documentation:
- `SHIPROCKET_INTEGRATION_COMPLETE.md` - Full guide
- `DEPLOYMENT_GUIDE.md` - Deployment steps
- `INTEGRATION_SUMMARY.md` - Everything done
- `QUICK_START.md` - This file

---

## 🔧 Environment Variables

Add these to `.env` file:

```env
# Shopify (Required)
VITE_SHOPIFY_STORE_DOMAIN=https://19sjnp-gx.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=be59fa0cf086500d7b6456e64f233866

# App Settings
VITE_APP_TITLE=THSIX
VITE_APP_URL=https://your-domain.vercel.app
```

**Note:** Copy `.env.example` to `.env` if it doesn't exist.

---

## 🐛 Troubleshooting

### Checkout button does nothing?
1. Open browser console (F12)
2. Look for errors
3. Check if Shiprocket script loaded
4. Verify product variant IDs are valid

### Images not loading?
1. Clear browser cache
2. Try incognito mode
3. Check image paths in code
4. Verify files exist in `public/assets/`

### Build fails?
1. Run `npm run build` locally
2. Check for TypeScript errors
3. Review Vercel build logs
4. Ensure all imports are correct

---

## 📞 Need Help?

### Documentation:
- Full integration guide: `SHIPROCKET_INTEGRATION_COMPLETE.md`
- Deployment guide: `DEPLOYMENT_GUIDE.md`
- Summary: `INTEGRATION_SUMMARY.md`

### Support:
- Shiprocket: support@shiprocket.com
- Shopify: https://help.shopify.com
- Vercel: https://vercel.com/support

---

## ✅ Deployment Checklist

Before going live:
- [ ] Push code to GitHub
- [ ] Vercel deployment successful
- [ ] Environment variables set
- [ ] Shiprocket dashboard configured
- [ ] Test checkout on live site
- [ ] All images loading
- [ ] Mobile responsive check
- [ ] Browser compatibility test

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly**
   - Add products to cart
   - Complete checkout flow
   - Test on mobile devices

2. **Monitor**
   - Check Vercel logs
   - Monitor Shiprocket dashboard
   - Watch for errors

3. **Enhance**
   - Add success/failure pages
   - Implement order tracking
   - Add analytics

---

**Ready to deploy?** Run the commands in Step 1 above! 🚀
