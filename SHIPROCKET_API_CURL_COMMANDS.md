# Shiprocket API Integration - cURL Commands

## Overview
These API endpoints fetch real products from your Shopify store and return them in the format required by Shiprocket.

**Current Status:**
- ✅ 8 Adidas products in Shopify
- ✅ Real-time synchronization with Shopify Storefront API
- ✅ Returns data in Shiprocket-compliant format
- ✅ Descriptive product handles for better SEO

**Product Handles:**
Products use numeric handles for simplicity:
- `1` - Samba Ivory Scarlet Earth
- `2` - Samba Monochrome Granite
- `3` - Samba Ivory Green Earth
- `4` - Samba Evergreen Vanilla Gum
- `5` - Samba Onyx Ivory Gum
- `6` - Samba Deep Indigo Cream
- `7` - Samba Burgundy Champagne
- `8` - Samba Cream Sand Gum

---

## Production API Base URL
```
https://thsix.com
```

---

## 1. Get All Products

Fetches all products from your Shopify store.

### cURL Command
```bash
curl -X GET "https://thsix.com/api/catalog/products" \
  -H "Content-Type: application/json"
```

### PowerShell Command (Windows)
```powershell
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products" -Method GET | ConvertTo-Json -Depth 10
```

### Expected Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "gid://shopify/Product/9690128728352",
      "title": "Samba Classic Ivory Scarlet Earth",
      "handle": "1",
      "description": "The classic Adidas Samba...",
      "vendor": "Adidas",
      "productType": "Sneakers",
      "tags": ["adidas", "sneakers", "classic"],
      "priceRange": {
        "minVariantPrice": {
          "amount": "110.0",
          "currencyCode": "USD"
        },
        "maxVariantPrice": {
          "amount": "110.0",
          "currencyCode": "USD"
        }
      },
      "images": [
        {
          "url": "https://cdn.shopify.com/...",
          "altText": "Samba Classic Ivory Scarlet Earth"
        }
      ],
      "variants": [
        {
          "id": "gid://shopify/ProductVariant/...",
          "title": "UK 7",
          "price": {
            "amount": "110.0",
            "currencyCode": "USD"
          },
          "availableForSale": true,
          "quantityAvailable": 999,
          "selectedOptions": [
            {
              "name": "Size",
              "value": "UK 7"
            }
          ]
        }
      ],
      "availableForSale": true,
      "totalInventory": 50
    }
  ]
}
```

---

## 2. Get All Collections

Fetches all collections from your Shopify store with their metadata.

### cURL Command
```bash
curl -X GET "https://thsix.com/api/catalog/collections" \
  -H "Content-Type: application/json"
```

### PowerShell Command (Windows)
```powershell
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/collections" -Method GET | ConvertTo-Json -Depth 10
```

### Expected Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "gid://shopify/Collection/756322607392",
      "title": "Adidas",
      "handle": "adidas",
      "description": "Adidas collection description...",
      "image": {
        "url": "https://cdn.shopify.com/...",
        "altText": "Adidas"
      },
      "productsCount": 8
    }
  ]
}
```

---

## 3. Get Products by Collection

Fetches all products belonging to a specific collection by collection handle.

### cURL Command
```bash
curl -X GET "https://thsix.com/api/catalog/products-by-collection?collection=adidas" \
  -H "Content-Type: application/json"
```

### PowerShell Command (Windows)
```powershell
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products-by-collection?collection=adidas" -Method GET | ConvertTo-Json -Depth 10
```

### Query Parameters
- `collection` (required): Collection handle (e.g., "adidas", "nike", "puma")

### Expected Response Format
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "gid://shopify/Collection/756322607392",
      "title": "Adidas",
      "handle": "adidas",
      "description": "Adidas collection description...",
      "image": {
        "url": "https://cdn.shopify.com/...",
        "altText": "Adidas"
      }
    },
    "products": [
      {
        "id": "gid://shopify/Product/9690128728352",
        "title": "Samba Classic Ivory Scarlet Earth",
        "handle": "1",
        "description": "The classic Adidas Samba...",
        "vendor": "Adidas",
        "productType": "Sneakers",
        "tags": ["adidas", "sneakers", "classic"],
        "priceRange": {
          "minVariantPrice": {
            "amount": "110.0",
            "currencyCode": "USD"
          }
        },
        "images": [
          {
            "url": "https://cdn.shopify.com/...",
            "altText": "Samba Classic Ivory Scarlet Earth"
          }
        ],
        "variants": [
          {
            "id": "gid://shopify/ProductVariant/...",
            "title": "UK 7",
            "price": {
              "amount": "110.0",
              "currencyCode": "USD"
            },
            "availableForSale": true,
            "quantityAvailable": 999,
            "selectedOptions": [
              {
                "name": "Size",
                "value": "UK 7"
              }
            ]
          }
        ],
        "availableForSale": true,
        "totalInventory": 50
      }
    ]
  }
}
```

---

## 4. Health Check

Simple endpoint to verify API is running.

### cURL Command
```bash
curl -X GET "https://thsix.com/api/hello" \
  -H "Content-Type: application/json"
```

### PowerShell Command (Windows)
```powershell
Invoke-RestMethod -Uri "https://thsix.com/api/hello" -Method GET
```

### Expected Response
```json
{
  "message": "Hello from Vercel!"
}
```

---

## Complete Test Suite

Run these commands in sequence to test all endpoints:

### Bash/cURL (Linux/Mac)
```bash
# 1. Health check
curl -X GET "https://thsix.com/api/hello"

# 2. Get all collections
curl -X GET "https://thsix.com/api/catalog/collections"

# 3. Get all products
curl -X GET "https://thsix.com/api/catalog/products"

# 4. Get Adidas products
curl -X GET "https://thsix.com/api/catalog/products-by-collection?collection=adidas"
```

### PowerShell (Windows)
```powershell
# 1. Health check
Invoke-RestMethod -Uri "https://thsix.com/api/hello"

# 2. Get all collections
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/collections" | ConvertTo-Json -Depth 10

# 3. Get all products
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products" | ConvertTo-Json -Depth 10

# 4. Get Adidas products
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products-by-collection?collection=adidas" | ConvertTo-Json -Depth 10
```

---

## Product URL Structure

Frontend product pages use the handle in the URL:
```
https://thsix.com/product/{handle}
```

**Example URLs** (with numeric handles):
- https://thsix.com/product/1
- https://thsix.com/product/2
- https://thsix.com/product/3
- https://thsix.com/product/4
- https://thsix.com/product/5
- https://thsix.com/product/6
- https://thsix.com/product/7
- https://thsix.com/product/8

The frontend dynamically fetches product data based on the handle parameter.

---

## Response Structure

### Success Response
All successful responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Error Codes

| HTTP Status | Description |
|-------------|-------------|
| `200` | Success - Request completed successfully |
| `400` | Bad Request - Missing or invalid parameters |
| `404` | Not Found - Collection or resource doesn't exist |
| `500` | Internal Server Error - Server-side issue |

---

## Data Fields Reference

### Product Object
- `id`: Shopify global product ID (string)
- `title`: Product display name
- `handle`: URL-friendly identifier (used in product URLs)
- `description`: Product description text
- `vendor`: Brand name (e.g., "Adidas")
- `productType`: Category (e.g., "Sneakers")
- `tags`: Array of product tags
- `priceRange`: Min/max price information
- `images`: Array of product images
- `variants`: Array of product variants (sizes, colors, etc.)
- `availableForSale`: Boolean indicating if product is purchasable
- `totalInventory`: Total available stock across all variants

### Variant Object
- `id`: Shopify global variant ID (string)
- `title`: Variant display name (e.g., "UK 7")
- `price`: Price object with amount and currency
- `availableForSale`: Boolean indicating if variant is purchasable
- `quantityAvailable`: Stock quantity (default: 999)
- `selectedOptions`: Array of option selections (Size, Color, etc.)

### Collection Object
- `id`: Shopify global collection ID (string)
- `title`: Collection display name
- `handle`: URL-friendly identifier
- `description`: Collection description text
- `image`: Collection featured image
- `productsCount`: Number of products in collection

---

## Important Notes

1. **Real-time Data**: All data is fetched directly from Shopify Storefront API in real-time. Cache propagation may take 1-2 minutes after Shopify updates.

2. **Product Handles**: Handles are now numeric (1-8) as requested by the developer team for simpler integration.

3. **Quantity Field**: Set to default value of 999 since inventory tracking is not enabled in Shopify.

4. **Images**: All image URLs are served from Shopify's CDN and are permanent/cacheable.

5. **Collection Handles**: Use collection handles (e.g., "adidas") not IDs when querying products by collection.

6. **No Authentication**: Currently, these endpoints are public. Add authentication layer if required.

---

## Testing Tips

### Pretty Print JSON (Linux/Mac)
```bash
curl -X GET "https://thsix.com/api/catalog/products" | jq '.'
```

### Save Response to File
```bash
# Bash
curl -X GET "https://thsix.com/api/catalog/products" -o products.json

# PowerShell
Invoke-RestMethod -Uri "https://thsix.com/api/catalog/products" | ConvertTo-Json -Depth 10 | Out-File products.json
```

### Test Specific Product by Handle
Filter the products array by handle after fetching all products (no single-product endpoint yet):
```bash
curl -X GET "https://thsix.com/api/catalog/products" | jq '.data[] | select(.handle == "1")'
```

### Check Response Time
```bash
curl -w "\nTime: %{time_total}s\n" -X GET "https://thsix.com/api/catalog/products"
```

---

## Integration Checklist

Before production integration:

- [ ] Test all 4 endpoints successfully
- [ ] Verify JSON response structure matches Shiprocket's requirements
- [ ] Test error handling (invalid collection handle, network failures)
- [ ] Confirm response times are acceptable (<2 seconds)
- [ ] Validate product data matches Shopify admin
- [ ] Verify all image URLs are accessible
- [ ] Test with different collection handles
- [ ] Confirm all product handles are numeric (1-8, not samba-1)
- [ ] Test frontend product URLs work with numeric handles
- [ ] Monitor API for 24-48 hours after launch
- [ ] Set up error logging and monitoring

---

## Data Synchronization

- **Source**: Shopify Storefront API (GraphQL)
- **Sync Method**: Real-time API calls (no caching)
- **Cache Duration**: Shopify CDN may cache for 1-2 minutes
- **Update Delay**: Changes in Shopify admin appear in API within 1-2 minutes
- **Image Hosting**: Shopify CDN
- **Inventory**: Default quantity of 999 (tracking disabled)

---

## Troubleshooting

### Issue: API returns empty data array
**Solution**: Check Shopify store has products published to "Online Store" sales channel

### Issue: Product handle not found (404)
**Solution**: Wait 1-2 minutes after updating handles in Shopify for cache propagation

### Issue: Images not loading
**Solution**: Verify image URLs in Shopify admin, ensure products have images assigned

### Issue: Collection not found
**Solution**: Use collection handle (e.g., "adidas") not ID, verify collection exists in Shopify

### Issue: Slow response times
**Solution**: Shopify API performance depends on their infrastructure, consider implementing caching layer

---

## Environment Variables

Required environment variables in Vercel:

```env
SHOPIFY_STORE_DOMAIN=19sjnp-gx.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=be59fa0cf086500d7b6456e64f233866
```

Note: These are backend-only variables (no VITE_ prefix). Already configured in production.

---

## Support

For API issues or questions:
1. Verify API is live: `curl https://thsix.com/api/hello`
2. Check Vercel deployment logs for errors
3. Confirm Shopify credentials are valid
4. Test with cURL commands provided above
5. Contact THSIX development team with specific error messages

---

**API Version**: 1.0  
**Last Updated**: September 2026 (numeric handles for developer team)  
**Shopify Storefront API**: 2024-01  
**Live Status**: https://thsix.com/api/hello
