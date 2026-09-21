# How to Get Shopify Variant IDs - Step by Step Guide

## 🎯 What You Need to Understand

**Variant IDs are NOT created by you** - Shopify creates them automatically when you add products!

You just need to **find and copy** them from your Shopify store.

---

## 📊 **Understanding Products vs Variants**

### Example:
```
Product: Adidas Samba OG
  ├─ Variant 1: Size 7  → Variant ID: gid://shopify/ProductVariant/48123456789
  ├─ Variant 2: Size 8  → Variant ID: gid://shopify/ProductVariant/48123456790
  ├─ Variant 3: Size 9  → Variant ID: gid://shopify/ProductVariant/48123456791
  └─ Variant 4: Size 10 → Variant ID: gid://shopify/ProductVariant/48123456792
```

If your product has NO variants (just one option), Shopify still creates 1 variant ID for it!

---

## 🔍 **Method 1: Get IDs from Shopify Admin** (EASIEST)

### Step 1: Login to Shopify Admin
Go to: https://19sjnp-gx.myshopify.com/admin

### Step 2: Go to Products
- Click **"Products"** in left sidebar
- You'll see list of all your products

### Step 3: Open a Product
- Click on any product (e.g., "Samba OG")
- You'll see product details page

### Step 4: Find Variants Section
Look for the **"Variants"** section on the page.

**If you see variants listed:**
```
Size 7  - ₹10,999  [Edit]
Size 8  - ₹10,999  [Edit]
Size 9  - ₹10,999  [Edit]
```

**If you see "This product has no options like size or color":**
- Your product has only 1 variant (default)
- It still has a variant ID!

### Step 5: Get the Variant ID

#### Option A: Click on a Variant
1. Click **Edit** next to a variant
2. Look at the URL in your browser:
```
https://19sjnp-gx.myshopify.com/admin/products/8123456789/variants/48123456789012
                                                                      ↑ This is your variant ID
```

3. Copy the number: `48123456789012`

#### Option B: Use Browser Inspector
1. Right-click on the variant → **Inspect Element**
2. Look for `data-variant-id="48123456789012"` in the HTML
3. Copy the number

### Step 6: Format the ID
Convert the number to the full format:

**From:** `48123456789012`  
**To:** `gid://shopify/ProductVariant/48123456789012`

Just add `gid://shopify/ProductVariant/` before the number!

---

## 🖥️ **Method 2: Use Shopify GraphQL Explorer** (RECOMMENDED)

This is the **easiest way** to get ALL variant IDs at once!

### Step 1: Open GraphQL Explorer
Go to: https://19sjnp-gx.myshopify.com/admin/api/graphiql.json

(Or: Shopify Admin → Apps → Develop apps → API credentials → Admin API)

### Step 2: Paste This Query
```graphql
{
  products(first: 50) {
    edges {
      node {
        id
        title
        handle
        variants(first: 50) {
          edges {
            node {
              id
              title
              price
              sku
              inventoryQuantity
            }
          }
        }
      }
    }
  }
}
```

### Step 3: Click "Play" Button ▶️

### Step 4: Copy Results
You'll get a response like this:

```json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "gid://shopify/Product/8123456789",
            "title": "Samba OG",
            "handle": "samba-og-cloud-white",
            "variants": {
              "edges": [
                {
                  "node": {
                    "id": "gid://shopify/ProductVariant/48123456789012",
                    "title": "Size 7",
                    "price": "10999.00",
                    "sku": "SAMBA-OG-7"
                  }
                },
                {
                  "node": {
                    "id": "gid://shopify/ProductVariant/48123456789013",
                    "title": "Size 8",
                    "price": "10999.00",
                    "sku": "SAMBA-OG-8"
                  }
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```

### Step 5: Extract the IDs
Copy the variant IDs from the response:
- `gid://shopify/ProductVariant/48123456789012`
- `gid://shopify/ProductVariant/48123456789013`

---

## 🛠️ **Method 3: Use Shopify REST API**

If GraphQL doesn't work, use REST API:

### Step 1: Get Your Access Token
- Go to Shopify Admin → Settings → Apps and sales channels
- Create a private app (if you haven't)
- Copy the Admin API access token

### Step 2: Use This URL in Browser
```
https://19sjnp-gx.myshopify.com/admin/api/2024-01/products.json?fields=id,title,variants
```

(You'll need to authenticate with your access token)

### Step 3: Parse the JSON Response
Look for variant IDs in the response.

---

## 📝 **Creating a Spreadsheet**

I recommend creating a spreadsheet to organize:

| Product Title | Variant Option | Variant ID | SKU | Price |
|--------------|----------------|------------|-----|-------|
| Samba OG | Cloud White / Core Black | gid://shopify/ProductVariant/48123456789012 | SAMBA-CW-CB | 10999 |
| Samba OG | Core Black / White | gid://shopify/ProductVariant/48123456789013 | SAMBA-CB-W | 10999 |

---

## 🎯 **What to Do After You Get the IDs**

### Step 1: Update Your Product Type
Edit `src/types/product.ts`:

```typescript
export interface Product {
  id: string;
  variantId: string; // ← Add this (make it required, not optional)
  title: string;
  color?: string;
  price: number;
  currency: string;
  image: string | null;
  available: boolean;
}
```

### Step 2: Update Your Product Data
Edit `src/data/products.ts`:

```typescript
export const sambaProducts: Product[] = [
  {
    id: "samba-og-cloud-white-core-black",
    variantId: "gid://shopify/ProductVariant/48123456789012", // ← Add this
    title: "Samba OG",
    color: "Cloud White / Core Black",
    price: 10999,
    currency: "INR",
    image: "/assets/products/samba-cloud-white.jpg",
    available: true
  },
  {
    id: "samba-og-core-black-white",
    variantId: "gid://shopify/ProductVariant/48123456789013", // ← Add this
    title: "Samba OG",
    color: "Core Black / White",
    price: 10999,
    currency: "INR",
    image: "/assets/products/samba-core-black.jpg",
    available: true
  },
  // ... rest of products
];
```

### Step 3: Test Again
```bash
# Restart dev server
npm run dev

# Test checkout flow
```

---

## ❓ **Common Questions**

### Q: What if my product has no variants?
**A:** Shopify still creates 1 default variant. Every product has at least 1 variant ID.

### Q: Can I use the product ID instead of variant ID?
**A:** No! Checkout requires variant IDs. Product IDs won't work.

### Q: What if I can't access Shopify Admin?
**A:** Ask your team/admin to:
1. Give you admin access, OR
2. Export the variant IDs for you

### Q: Do I need variant IDs for ALL products?
**A:** You only need variant IDs for products you want customers to buy. "Coming Soon" products can wait.

### Q: What if variant ID is wrong?
**A:** Checkout will fail. Shopify will return "Product not found" error.

### Q: Can I test with fake variant IDs?
**A:** No! They must be real IDs from your Shopify store.

---

## 🚨 **Important Notes**

1. **Variant IDs are PERMANENT** - Once created, they don't change
2. **Each variant is UNIQUE** - Different sizes/colors have different IDs
3. **IDs are LONG** - Usually 14-15 digits
4. **Format MATTERS** - Must include `gid://shopify/ProductVariant/` prefix
5. **Case SENSITIVE** - Copy exactly as shown

---

## 📧 **Email Template to Send Your Team**

If you can't access Shopify Admin:

```
Subject: Need Shopify Variant IDs for Products

Hi Team,

I need Shopify variant IDs for our products to complete the checkout integration.

Please provide variant IDs for these products:
1. Samba OG - Cloud White / Core Black
2. Samba OG - Core Black / White
3. Samba OG - Off White / Green
4. Samba OG - White / Grey

FORMAT NEEDED:
gid://shopify/ProductVariant/48123456789012

HOW TO GET THEM:
Method 1: Shopify Admin → Products → Click product → Click variant → Copy ID from URL
Method 2: Use GraphQL query (see attached guide)

Or just export a CSV with:
- Product Title
- Variant Title
- Variant ID

Thanks!
```

---

## ✅ **Quick Checklist**

Before you can test checkout:
- [ ] Have access to Shopify Admin
- [ ] Can see products in Shopify
- [ ] Products have at least 1 variant
- [ ] Got variant IDs (using one of the methods above)
- [ ] Updated `src/types/product.ts` 
- [ ] Updated `src/data/products.ts` with real variant IDs
- [ ] Restarted dev server
- [ ] Tested checkout flow

---

## 🎯 **Next Steps**

1. **Choose a method** (I recommend Method 2 - GraphQL)
2. **Get ALL variant IDs** for your products
3. **Update the code** (types and data files)
4. **Test checkout** again
5. **Deploy!**

---

**Need help?** Let me know which method you're using and I can guide you through it!
