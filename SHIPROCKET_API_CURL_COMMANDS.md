# Shiprocket API Integration - cURL Commands

## Overview
These API endpoints fetch real products from your Shopify store and return them in the format required by Shiprocket.

**Current Status:**
- ✅ 6 Adidas products in Shopify
- ✅ Real-time synchronization with Shopify Storefront API
- ✅ Returns data in Shiprocket-compliant format

---

## Production API Base URL
```
https://thsix.vercel.app
```

---

## 1. Get All Products

Fetches all products from your Shopify store with pagination support.

### cURL Command
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/products" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### With Pagination
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/products?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Expected Response Format
```json
{
  "ok": true,
  "result": {
    "total": 6,
    "products": [
      {
        "id": "8471819985143",
        "title": "Samba OG",
        "body_html": "<p>Product description from Shopify</p>",
        "vendor": "Adidas",
        "product_type": "Sneakers",
        "created_at": "2024-01-15T10:30:00Z",
        "handle": "samba-og-cloud-white",
        "updated_at": "2024-01-15T10:30:00Z",
        "tags": "Adidas, Samba, Sneakers",
        "status": "active",
        "variants": [
          {
            "id": "46080770916599",
            "title": "UK 8",
            "price": "10999.00",
            "compare_at_price": "12999.00",
            "sku": "SAMBA-OG-8",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "taxable": true,
            "quantity": 50,
            "grams": 800,
            "image": {
              "src": "https://cdn.shopify.com/..."
            },
            "option_values": {
              "Size": "UK 8"
            },
            "weight": 0.8,
            "weight_unit": "kg"
          }
        ],
        "options": [
          {
            "name": "Size",
            "values": ["UK 7", "UK 8", "UK 9", "UK 10"]
          }
        ],
        "image": {
          "src": "https://cdn.shopify.com/..."
        }
      }
    ]
  },
  "errorCode": null
}
```

---

## 2. Get All Collections

Fetches all collections from your Shopify store.

### cURL Command
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/collections" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### With Pagination
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/collections?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Expected Response Format
```json
{
  "ok": true,
  "result": {
    "total": 1,
    "collections": [
      {
        "id": "462587527415",
        "updated_at": "2024-01-15T10:30:00Z",
        "body_html": "<p>Collection description from Shopify</p>",
        "handle": "adidas",
        "image": {
          "src": "https://cdn.shopify.com/..."
        },
        "title": "Adidas Collection",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "errorCode": null
}
```

---

## 3. Get Products by Collection

Fetches products from a specific collection.

### cURL Command
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/products-by-collection?collection_id=462587527415" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### With Pagination
```bash
curl -X GET "https://thsix.vercel.app/api/catalog/products-by-collection?collection_id=462587527415&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Expected Response Format
```json
{
  "ok": true,
  "result": {
    "total": 6,
    "products": [
      {
        "id": "8471819985143",
        "title": "Samba OG",
        "body_html": "<p>Product description</p>",
        "vendor": "Adidas",
        "product_type": "Sneakers",
        "handle": "samba-og-cloud-white",
        "status": "active",
        "variants": [...],
        "options": [...],
        "image": {...}
      }
    ]
  },
  "errorCode": null
}
```

---

## 4. Test Hello Endpoint

Simple endpoint to verify API is working.

### cURL Command
```bash
curl -X GET "https://thsix.vercel.app/api/hello" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "ok": true,
  "message": "Vercel API is working!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "GET",
  "path": "/api/hello"
}
```

---

## Query Parameters

### Pagination Parameters (All Endpoints)
- `page` (optional, default: 1) - Page number, must be >= 1
- `limit` (optional, default: 100, max: 250) - Number of items per page

### Collection-Specific Parameters
- `collection_id` (required for products-by-collection) - Shopify collection ID

---

## Response Structure

All successful responses follow this format:
```json
{
  "ok": true,
  "result": {
    // Response data here
  },
  "errorCode": null
}
```

All error responses follow this format:
```json
{
  "ok": false,
  "result": null,
  "errorCode": "ERROR_CODE",
  "message": "Error description"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid query parameters (e.g., page < 1) |
| `NOT_FOUND` | 404 | Collection not found |
| `INTERNAL_ERROR` | 500 | Server error (check logs) |

---

## Data Fields Returned

### Product Fields
- `id`: Shopify product ID (string)
- `title`: Product name
- `body_html`: Product description (HTML)
- `vendor`: Brand name (e.g., "Adidas")
- `product_type`: Category (e.g., "Sneakers")
- `handle`: URL-friendly product identifier
- `status`: Always "active"
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `tags`: Comma-separated tags
- `variants`: Array of product variants
- `options`: Array of product options (Size, Color, etc.)
- `image`: Featured product image

### Variant Fields
- `id`: Shopify variant ID (string)
- `title`: Variant name (e.g., "UK 8")
- `price`: Price as string with 2 decimals (e.g., "10999.00")
- `compare_at_price`: Original price (if on sale)
- `sku`: Stock Keeping Unit
- `quantity`: Available stock
- `grams`: Weight in grams
- `weight`: Weight in specified unit
- `weight_unit`: Unit of weight (e.g., "kg")
- `taxable`: Boolean
- `image`: Variant-specific image (if exists)
- `option_values`: Object with option names and values

### Collection Fields
- `id`: Shopify collection ID (string)
- `title`: Collection name
- `handle`: URL-friendly identifier
- `body_html`: Collection description (HTML)
- `image`: Collection image
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

---

## Important Notes

1. **Real-time Data**: All data is fetched in real-time from Shopify. No caching is implemented.

2. **Collection IDs**: To get the collection ID, first call `/api/catalog/collections` and use the `id` field.

3. **Product IDs**: Product and variant IDs are Shopify's numeric IDs (extracted from their global IDs).

4. **Prices**: All prices are returned as strings with 2 decimal places (e.g., "10999.00" for ₹109.99).

5. **Images**: Image URLs are direct Shopify CDN links.

6. **Authentication**: Currently, these endpoints are public. Add authentication if needed.

---

## Testing Sequence

1. **Test API is live:**
   ```bash
   curl https://thsix.vercel.app/api/hello
   ```

2. **Get all collections:**
   ```bash
   curl https://thsix.vercel.app/api/catalog/collections
   ```

3. **Get all products:**
   ```bash
   curl https://thsix.vercel.app/api/catalog/products
   ```

4. **Get products by collection** (use collection ID from step 2):
   ```bash
   curl "https://thsix.vercel.app/api/catalog/products-by-collection?collection_id=YOUR_COLLECTION_ID"
   ```

---

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Verify Shopify credentials in environment variables
3. Test endpoints with the cURL commands above
4. Contact developer team with specific error messages

---

## Environment Variables Required

These must be set in Vercel:

```
SHOPIFY_STORE_DOMAIN=https://19sjnp-gx.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=be59fa0cf086500d7b6456e64f233866
SHIPROCKET_API_KEY=<provided by Shiprocket>
SHIPROCKET_API_SECRET=<provided by Shiprocket>
```

---

**Last Updated:** January 2024  
**API Version:** 1.0  
**Shopify API Version:** 2024-01
