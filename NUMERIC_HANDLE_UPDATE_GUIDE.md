# Numeric Handle Update Guide for THSIX Products

## Overview
This guide shows how to update all product handles to numeric format (1, 2, 3, etc.) as requested by the developer team.

## Current vs New Handles

| Current Handle                | New Handle | Product Title                |
|------------------------------|------------|------------------------------|
| samba-ivory-scarlet-earth    | 1          | Samba Ivory Scarlet Earth    |
| samba-monochrome-granite     | 2          | Samba Monochrome Granite     |
| samba-ivory-green-earth      | 3          | Samba Ivory Green Earth      |
| samba-evergreen-vanilla-gum  | 4          | Samba Evergreen Vanilla Gum  |
| samba-onyx-ivory-gum         | 5          | Samba Onyx Ivory Gum         |
| samba-deep-indigo-cream      | 6          | Samba Deep Indigo Cream      |
| samba-burgundy-champagne     | 7          | Samba Burgundy Champagne     |
| cloud-white-core-black-gum   | 8          | Samba Cream Sand Gum         |

## Step-by-Step Instructions

### For Each Product:

1. **Go to Shopify Admin**: https://19sjnp-gx.myshopify.com/admin/products

2. **Click on the product** you want to update

3. **Scroll down to "Search engine listing"** section (near the bottom)

4. **Click "Edit website SEO"**

5. **Update the URL handle** to the numeric value from the table above:
   - Example: Change `samba-ivory-scarlet-earth` to `1`
   - Just type the number without any prefixes or suffixes

6. **Click "Save"** at the top right

7. **Wait 1-2 minutes** before testing the new URL

### Quick Update Checklist:

- [ ] Product 1: Change `samba-ivory-scarlet-earth` → `1`
- [ ] Product 2: Change `samba-monochrome-granite` → `2`
- [ ] Product 3: Change `samba-ivory-green-earth` → `3`
- [ ] Product 4: Change `samba-evergreen-vanilla-gum` → `4`
- [ ] Product 5: Change `samba-onyx-ivory-gum` → `5`
- [ ] Product 6: Change `samba-deep-indigo-cream` → `6`
- [ ] Product 7: Change `samba-burgundy-champagne` → `7`
- [ ] Product 8: Change `cloud-white-core-black-gum` → `8`

## New Product URLs

After updating, your products will be accessible at:

- https://thsix.com/product/1
- https://thsix.com/product/2
- https://thsix.com/product/3
- https://thsix.com/product/4
- https://thsix.com/product/5
- https://thsix.com/product/6
- https://thsix.com/product/7
- https://thsix.com/product/8

## Testing After Update

### PowerShell Test Commands:

```powershell
# Test API returns numeric handles
$response = Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products" -Method GET
$response.result.products | Select-Object handle, title

# Test individual product URLs (after waiting 1-2 minutes)
1..8 | ForEach-Object {
    Write-Host "Testing product $_..." -ForegroundColor Cyan
    try {
        $page = Invoke-WebRequest -Uri "https://thsix.com/product/$_" -Method HEAD
        Write-Host "  ✓ Status: $($page.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

### cURL Test Commands:

```bash
# Test API returns numeric handles
curl https://thsix.com/api/catalog/products | jq '.result.products[] | {handle, title}'

# Test individual product URLs
for i in {1..8}; do
  echo "Testing product $i..."
  curl -I https://thsix.com/product/$i
done
```

## Important Notes

1. **No Code Changes Required**: The frontend is already handle-agnostic and will work with any handle format (numeric, descriptive, etc.)

2. **Cache Propagation**: After updating handles in Shopify, wait 1-2 minutes for Shopify's cache to update

3. **Vercel Deployment**: The recent vercel.json fix enables all product URLs to work correctly

4. **API Updates Automatically**: The API fetches data directly from Shopify, so handles will update automatically after cache clears

5. **SEO Consideration**: Numeric handles are less SEO-friendly than descriptive ones, but if the developer team requires them for their system, that's the priority

## API Response Format

After the update, the API will return:

```json
{
  "ok": true,
  "result": {
    "total": 8,
    "products": [
      {
        "id": "...",
        "title": "Samba Ivory Scarlet Earth",
        "handle": "1",
        ...
      },
      {
        "id": "...",
        "title": "Samba Monochrome Granite",
        "handle": "2",
        ...
      }
    ]
  }
}
```

## For Developer Team

Share these API endpoints:

- All products: `https://thsix.com/api/catalog/products`
- Collections: `https://thsix.com/api/catalog/collections`
- Products by collection: `https://thsix.com/api/catalog/products-by-collection?collection=adidas`

Product URLs will use numeric handles:
- `https://thsix.com/product/1`
- `https://thsix.com/product/2`
- etc.

## Troubleshooting

### Issue: Product page shows 404
**Solution**: Wait 1-2 minutes after updating the handle for Shopify cache to clear

### Issue: Old URLs still work
**Solution**: Shopify may redirect old handles temporarily. This is normal during transition

### Issue: API still shows old handles
**Solution**: Clear browser cache or wait for Shopify's cache to expire (1-2 minutes)

## Support

After updating all handles:
1. Test all 8 product URLs
2. Verify API returns correct numeric handles
3. Share updated API documentation with developer team
4. Monitor for any routing issues

---

**Last Updated**: September 2026
**Handles Format**: Numeric (1-8)
**Status**: Ready to update
