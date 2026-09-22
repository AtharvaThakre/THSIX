# Action Plan: Update to Numeric Handles

## What You Need to Do Now

### Step 1: Update Handles in Shopify Admin

Go to: https://19sjnp-gx.myshopify.com/admin/products

Update each product following this mapping:

| Product Name | Current Handle | Change To |
|-------------|----------------|-----------|
| Samba Ivory Scarlet Earth | samba-ivory-scarlet-earth | **1** |
| Samba Monochrome Granite | samba-monochrome-granite | **2** |
| Samba Ivory Green Earth | samba-ivory-green-earth | **3** |
| Samba Evergreen Vanilla Gum | samba-evergreen-vanilla-gum | **4** |
| Samba Onyx Ivory Gum | samba-onyx-ivory-gum | **5** |
| Samba Deep Indigo Cream | samba-deep-indigo-cream | **6** |
| Samba Burgundy Champagne | samba-burgundy-champagne | **7** |
| Samba Cream Sand Gum | cloud-white-core-black-gum | **8** |

**For each product:**
1. Click the product
2. Scroll to "Search engine listing" section
3. Click "Edit website SEO"
4. Change the URL handle to just the number (1, 2, 3, etc.)
5. Click "Save"

### Step 2: Wait for Cache
Wait **1-2 minutes** after updating all products for Shopify's cache to update.

### Step 3: Test the New URLs

Run this PowerShell command to test all product pages:

```powershell
# Test all 8 product URLs
1..8 | ForEach-Object {
    Write-Host "Testing https://thsix.com/product/$_" -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri "https://thsix.com/product/$_" -Method HEAD | Out-Null
        Write-Host "  ✓ Working!" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Not found yet (wait a bit longer)" -ForegroundColor Yellow
    }
}
```

### Step 4: Verify API Returns Numeric Handles

```powershell
# Check API returns correct handles
$response = Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products"
$response.result.products | Select-Object handle, title | Format-Table -AutoSize
```

You should see:
```
handle  title
------  -----
1       Samba Ivory Scarlet Earth
2       Samba Monochrome Granite
3       Samba Ivory Green Earth
4       Samba Evergreen Vanilla Gum
5       Samba Onyx Ivory Gum
6       Samba Deep Indigo Cream
7       Samba Burgundy Champagne
8       Samba Cream Sand Gum
```

## What's Already Done (No Code Changes Needed!)

✅ **Frontend is ready** - ProductDetailPage works with any handle format
✅ **Routing is fixed** - vercel.json now supports SPA routing
✅ **API is handle-agnostic** - Fetches directly from Shopify
✅ **Documentation updated** - SHIPROCKET_API_CURL_COMMANDS.md has numeric examples

## New Product URLs

After the update, your products will be at:
- https://thsix.com/product/1
- https://thsix.com/product/2
- https://thsix.com/product/3
- https://thsix.com/product/4
- https://thsix.com/product/5
- https://thsix.com/product/6
- https://thsix.com/product/7
- https://thsix.com/product/8

## For Your Developer Team

Share these documents:
1. **SHIPROCKET_API_CURL_COMMANDS.md** - Complete API documentation with numeric handle examples
2. **API Endpoints:**
   - Products: `https://thsix.com/api/catalog/products`
   - Collections: `https://thsix.com/api/catalog/collections`
   - Products by collection: `https://thsix.com/api/catalog/products-by-collection?collection=adidas`

3. **Product URL Format:** `https://thsix.com/product/{handle}`
   - Example: `https://thsix.com/product/1`

## Why This Works

1. **No frontend code changes needed** - Your React app uses the handle parameter dynamically
2. **No API changes needed** - API fetches from Shopify in real-time
3. **Vercel routing is fixed** - The recent vercel.json update enables all routes
4. **Simple for integration** - Numeric handles (1-8) are easier for external systems

## Quick Reference

**Before:** `https://thsix.com/product/samba-ivory-scarlet-earth`  
**After:** `https://thsix.com/product/1`

Both the API and frontend will automatically work with the new handles once you update them in Shopify!

---

**Status**: Ready to update in Shopify admin
**Time needed**: ~10 minutes to update all 8 products
**Testing**: 1-2 minutes after updates complete
