# API Endpoints Documentation

## Overview
This document describes all API endpoints available in the THSIX application for Shiprocket Checkout integration.

---

## Catalog APIs (Seller APIs)

These endpoints are called by Shiprocket to sync your product catalog.

### GET /api/catalog/products
Fetch all products with pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 100, max: 250) - Items per page

**Example Request:**
```bash
curl https://thsix.com/api/catalog/products?page=1&limit=100
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "total": 50,
    "products": [
      {
        "id": "samba-og-cloud-white",
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
  }
}
```

---

### GET /api/catalog/collections
Fetch all collections with pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 100, max: 250)

**Example Request:**
```bash
curl https://thsix.com/api/catalog/collections?page=1&limit=100
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "total": 10,
    "collections": [
      {
        "id": "adidas-collection",
        "title": "Adidas Collection",
        "handle": "adidas",
        "body_html": "<p>Collection description</p>",
        "image": {...}
      }
    ]
  }
}
```

---

### GET /api/catalog/products-by-collection
Fetch products belonging to a specific collection.

**Query Parameters:**
- `collection_id` (required) - Collection identifier
- `page` (optional, default: 1)
- `limit` (optional, default: 100, max: 250)

**Example Request:**
```bash
curl https://thsix.com/api/catalog/products-by-collection?collection_id=adidas-collection&page=1&limit=100
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "total": 25,
    "products": [...]
  }
}
```

---

## Checkout APIs

These endpoints handle checkout flow from the frontend.

### POST /api/checkout/access-token
Generate access token for Shiprocket checkout.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "cart_data": {
    "items": [
      {
        "variant_id": "product-variant-123",
        "quantity": 2
      }
    ]
  },
  "redirect_url": "https://thsix.com/checkout/success"
}
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "order_id": "65a000df3fc6c468b9da1f53"
  }
}
```

**Error Response:**
```json
{
  "ok": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "cart_data.items is required and must be an array"
}
```

---

### POST /api/checkout/order-details
Fetch order details by order ID.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "order_id": "65a000df3fc6c468b9da1f53"
}
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "order_id": "65a000df3fc6c468b9da1f53",
    "status": "SUCCESS",
    "email": "customer@example.com",
    "phone": "9876543210",
    "total_amount_payable": 2999.00,
    "payment_type": "PREPAID",
    "payment_status": "Success",
    "shipping_address": {...},
    "billing_address": {...},
    "cart_data": {...}
  }
}
```

---

## Webhook Endpoints

These endpoints receive notifications from Shiprocket or send updates to Shiprocket.

### POST /api/webhooks/order
Receive order details from Shiprocket after successful checkout.

**Headers (sent by Shiprocket):**
- `Content-Type: application/json`
- `X-Api-Key: <your-api-key>`
- `X-Api-HMAC-SHA256: <calculated-hmac>`

**Request Body (from Shiprocket):**
```json
{
  "order_id": "65a000df3fc6c468b9da1f53",
  "cart_data": {
    "items": [
      {
        "variant_id": "product-variant-123",
        "quantity": 2
      }
    ]
  },
  "status": "SUCCESS",
  "email": "customer@example.com",
  "phone": "9876543210",
  "payment_type": "PREPAID",
  "payment_status": "Success",
  "total_amount_payable": 2999.00,
  "shipping_address": {...},
  "billing_address": {...}
}
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "received": true,
    "order_id": "65a000df3fc6c468b9da1f53",
    "message": "Order webhook processed successfully"
  }
}
```

**Error Response (Authentication Failed):**
```json
{
  "ok": false,
  "errorCode": "AUTH_ERROR",
  "message": "Invalid or missing X-Api-Key header"
}
```

---

### POST /api/webhooks/product-update
Sync product updates to Shiprocket.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "id": "product-123",
  "title": "Samba OG",
  "body_html": "<p>Updated description</p>",
  "vendor": "Adidas",
  "product_type": "Sneakers",
  "status": "active",
  "updated_at": "2024-01-15T10:30:00Z",
  "variants": [...],
  "image": {...},
  "options": [...]
}
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "synced": true,
    "product_id": "product-123",
    "message": "Product synced to Shiprocket successfully"
  }
}
```

---

### POST /api/webhooks/collection-update
Sync collection updates to Shiprocket.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "id": "collection-123",
  "title": "Adidas Collection",
  "body_html": "<p>Updated collection description</p>",
  "handle": "adidas",
  "updated_at": "2024-01-15T10:30:00Z",
  "image": {...}
}
```

**Example Response:**
```json
{
  "ok": true,
  "result": {
    "synced": true,
    "collection_id": "collection-123",
    "message": "Collection synced to Shiprocket successfully"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (missing or invalid parameters) |
| `AUTH_ERROR` | 511 | Authentication failed (invalid API key or HMAC) |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFIG_ERROR` | 500 | Server configuration error (missing environment variables) |
| `SHIPROCKET_ERROR` | varies | Error from Shiprocket API |
| `INVALID_RESPONSE` | 500 | Unexpected response format from Shiprocket |

---

## Authentication

### Webhook Authentication (Incoming from Shiprocket)

Webhooks from Shiprocket are authenticated using:
1. **X-Api-Key**: Your API key
2. **X-Api-HMAC-SHA256**: HMAC SHA256 signature of request body

The signature is verified using:
```
HMAC-SHA256(request_body, api_secret) -> Base64
```

### API Authentication (Outgoing to Shiprocket)

Requests to Shiprocket APIs include:
1. **X-Api-Key**: Your API key
2. **X-Api-HMAC-SHA256**: HMAC SHA256 signature of request body

Generated automatically by the backend.

---

## Rate Limits

Currently, no rate limits are enforced on these endpoints. However, consider implementing rate limiting for production:

- Catalog APIs: Reasonable limits to prevent abuse
- Checkout APIs: Rate limit per IP/user to prevent spam
- Webhook endpoints: Authenticated, so less concern

---

## Testing

### Using cURL

```bash
# Test products API
curl -X GET https://thsix.com/api/catalog/products?page=1&limit=10

# Test checkout token generation
curl -X POST https://thsix.com/api/checkout/access-token \
  -H "Content-Type: application/json" \
  -d '{
    "cart_data": {
      "items": [{"variant_id": "test-variant", "quantity": 1}]
    },
    "redirect_url": "https://thsix.com/checkout/success"
  }'
```

### Using Postman

Import the Shiprocket API documentation:
https://documenter.getpostman.com/view/25617008/2sB34bL3ig

---

## Support

For API-related issues:
1. Check Vercel function logs
2. Review error codes above
3. Refer to SHIPROCKET_INTEGRATION.md for troubleshooting
4. Contact Shiprocket support for their API issues
