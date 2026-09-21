# Shopify Product Handle Update Guide

## Current Problem
Your product handles are not descriptive:
- `samba` → Not clear which Samba variant
- `samba-1` → Just a number, not descriptive
- `samba-2` → Not helpful for SEO or users
- `cloud-white-core-black-gum` → Only the last one is descriptive

## Recommended New Handles

Based on your 8 products, here are the recommended handles:

| # | Product Name | Current Handle | Recommended Handle |
|---|---|---|---|
| 1 | Samba Ivory Scarlet Earth | `samba` | `samba-ivory-scarlet-earth` |
| 2 | Samba Monochrome Granite | `samba-1` | `samba-monochrome-granite` |
| 3 | Samba Ivory Green Earth | `samba-2` | `samba-ivory-green-earth` |
| 4 | Samba Evergreen Vanilla Gum | `samba-4` | `samba-evergreen-vanilla-gum` |
| 5 | Samba Core Black White | `samba-5` | `samba-core-black-white` |
| 6 | Samba Charcoal Olive Gum | `samba-8` | `samba-charcoal-olive-gum` |
| 7 | Samba Ash Navy Gum | `samba-10` | `samba-ash-navy-gum` |
| 8 | Cloud White Core Black Gum | `cloud-white-core-black-gum` | ✅ Already good! |

---

## How to Update Handles in Shopify

### Step 1: Go to Shopify Admin
1. Log in to: https://19sjnp-gx.myshopify.com/admin
2. Go to **Products** in the left sidebar

### Step 2: Update Each Product
For each product:

1. Click on the product name
2. Scroll to **Search engine listing** section
3. Click **Edit website SEO**
4. Update the **URL handle** field
5. Click **Save**

**Example for "Samba Ivory Scarlet Earth":**
```
Old: samba
New: samba-ivory-scarlet-earth
```

### Step 3: Update All Products

#### Product 1: Samba Ivory Scarlet Earth
- Go to product page
- Change handle from `samba` to `samba-ivory-scarlet-earth`
- Save

#### Product 2: Samba Monochrome Granite  
- Go to product page
- Change handle from `samba-1` to `samba-monochrome-granite`
- Save

#### Product 3: Samba Ivory Green Earth
- Go to product page
- Change handle from `samba-2` to `samba-ivory-green-earth`
- Save

#### Product 4: Samba Evergreen Vanilla Gum
- Go to product page
- Change handle from `samba-4` to `samba-evergreen-vanilla-gum`
- Save

#### Product 5: Samba Core Black White
- Go to product page
- Change handle from `samba-5` to `samba-core-black-white`
- Save

#### Product 6: Samba Charcoal Olive Gum
- Go to product page
- Change handle from `samba-8` to `samba-charcoal-olive-gum`
- Save

#### Product 7: Samba Ash Navy Gum
- Go to product page
- Change handle from `samba-10` to `samba-ash-navy-gum`
- Save

#### Product 8: Cloud White Core Black Gum
- ✅ Already has a good handle: `cloud-white-core-black-gum`
- No change needed

---

## Benefits of Better Handles

### 1. **SEO Improvement**
- Search engines understand what the product is
- Better ranking for color-specific searches
- More descriptive URLs

### 2. **User Experience**
- Users can see product variant in URL
- Easier to share specific products
- More professional appearance

### 3. **Analytics**
- Clearer tracking of which products are popular
- Better understanding of traffic sources
- Easier to identify products in reports

### 4. **Frontend/Backend Sync**
- API returns descriptive handles
- Frontend URLs are meaningful
- Product pages have clear slugs

---

## After Updating in Shopify

Once you've updated the handles in Shopify:

1. **API will automatically reflect changes** (no code changes needed)
2. **Frontend will automatically use new handles** (React app fetches from API)
3. **URLs will be more descriptive**: 
   - Old: `thsix.com/product/samba-1`
   - New: `thsix.com/product/samba-monochrome-granite`

---

## Important Notes

⚠️ **Warning:** Changing handles will break existing bookmarks and links!

**To minimize impact:**
1. Update all at once (not gradually)
2. Consider setting up redirects in Shopify
3. Update any marketing materials with old links

**Shopify Redirects:**
- Shopify automatically creates redirects for old handles
- Old URLs will redirect to new URLs
- No broken links for customers

---

## Verification

After updating, test each product:

```bash
# Test that API returns new handles
curl https://thsix.vercel.app/api/catalog/products | grep "handle"

# Should show:
# "handle": "samba-ivory-scarlet-earth"
# "handle": "samba-monochrome-granite"
# etc.
```

---

## Need Help?

If you need assistance:
1. Take screenshots of any errors
2. Check that all 8 products are updated
3. Verify the frontend is showing new URLs
4. Test that product pages load correctly

The changes will take effect immediately in your Shopify store and API!
