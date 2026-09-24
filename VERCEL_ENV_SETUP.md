# Vercel Environment Variables Setup

## 🚀 Quick Setup Guide

Follow these steps to add Shiprocket API keys to your Vercel project.

## Step 1: Access Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Log in to your account
3. Find and click on your **THSIX** project

## Step 2: Navigate to Environment Variables

1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar

## Step 3: Add Variables

Add each of the following variables one by one:

### Required Variables

| Variable Name | Value | Select Environments |
|---------------|-------|---------------------|
| `SHIPROCKET_API_KEY` | `93B0a2SK2S9srY1N` | ☑️ Production<br>☑️ Preview<br>☑️ Development |
| `SHIPROCKET_API_SECRET` | `4slCXvmTfW3CKWwhYiMQCu0ngIIOZ6fN` | ☑️ Production<br>☑️ Preview<br>☑️ Development |

### Optional Variables (Already Set in Code)

| Variable Name | Value | Select Environments |
|---------------|-------|---------------------|
| `SHIPROCKET_BASE_URL` | `https://checkout-api.shiprocket.com` | ☑️ Production<br>☑️ Preview<br>☑️ Development |
| `WEBSITE_BASE_URL` | `https://thsix.com` | ☑️ Production |
| `CHECKOUT_SUCCESS_URL` | `/checkout/success` | ☑️ Production<br>☑️ Preview<br>☑️ Development |
| `CHECKOUT_FAILURE_URL` | `/checkout/failure` | ☑️ Production<br>☑️ Preview<br>☑️ Development |

## Step 4: Save Each Variable

For each variable:

1. Click **Add New** button
2. Enter the **Key** (variable name)
3. Enter the **Value** (from table above)
4. Select **Environments**: Check all three boxes (Production, Preview, Development)
5. Click **Save**

## Step 5: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click on the three dots (...) next to the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

OR simply push a new commit and it will auto-deploy.

## 🧪 Verification

After redeployment, verify the integration:

1. Visit your site: https://thsix.com
2. Open browser DevTools (F12)
3. Check console for any errors
4. Add items to cart
5. Click "Checkout" button
6. Shiprocket checkout modal should open

## 📸 Visual Guide

### Adding a Variable:

```
┌─────────────────────────────────────┐
│ Add New Environment Variable        │
├─────────────────────────────────────┤
│                                     │
│ Key:   SHIPROCKET_API_KEY          │
│                                     │
│ Value: 93B0a2SK2S9srY1N            │
│                                     │
│ ☑️ Production                       │
│ ☑️ Preview                          │
│ ☑️ Development                      │
│                                     │
│ [Cancel]  [Save]                    │
└─────────────────────────────────────┘
```

## ⚠️ Security Notes

- ✅ Never commit these values to Git
- ✅ Only add them in Vercel Dashboard
- ✅ Keep API keys private
- ✅ Rotate keys if accidentally exposed

## 🆘 Troubleshooting

### Problem: Checkout button doesn't work

**Solution:**
1. Check browser console for errors
2. Verify environment variables are set in Vercel
3. Ensure you clicked all three environment checkboxes
4. Redeploy after adding variables

### Problem: API returns "result" instead of "data"

**Solution:**
1. Clear browser cache
2. Verify latest deployment is active
3. Check if changes were pushed to Git

### Problem: "Shiprocket not loaded" error

**Solution:**
1. Check if `index.html` has the Shiprocket script tags
2. Verify network requests in DevTools
3. Check for ad blockers blocking the script

## ✅ Checklist

- [ ] Logged into Vercel Dashboard
- [ ] Opened THSIX project
- [ ] Went to Settings → Environment Variables
- [ ] Added `SHIPROCKET_API_KEY` to all environments
- [ ] Added `SHIPROCKET_API_SECRET` to all environments
- [ ] Saved all variables
- [ ] Redeployed the application
- [ ] Tested checkout flow
- [ ] Verified Shiprocket modal opens

## 📞 Need Help?

If you encounter issues:
1. Review SHIPROCKET_SETUP.md
2. Run `.\verify-shiprocket-integration.ps1` locally
3. Contact Shiprocket support if checkout issues persist
