/**
 * Shopify Products Service
 * Fetches products dynamically from Shopify Storefront API
 * This ensures products are always up-to-date with your Shopify store
 */

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
  console.error('Shopify configuration missing!');
}

const SHOPIFY_STOREFRONT_API_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        sku: string | null;
        image: {
          url: string;
        } | null;
      };
    }>;
  };
  availableForSale: boolean;
}

interface ShopifyGraphQLResponse {
  data: {
    products: {
      edges: Array<{
        node: ShopifyProduct;
      }>;
    };
  };
}

/**
 * Fetch all products from Shopify
 */
export async function fetchShopifyProducts(limit = 50): Promise<ShopifyProduct[]> {
  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  sku
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { first: limit },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data: ShopifyGraphQLResponse = await response.json();
    
    if (!data.data || !data.data.products) {
      throw new Error('Invalid response from Shopify API');
    }

    return data.data.products.edges.map(edge => edge.node);
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

/**
 * Fetch a specific product by handle
 */
export async function fetchShopifyProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        description
        availableForSale
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
              sku
              image {
                url
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { handle },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.productByHandle || null;
  } catch (error) {
    console.error('Error fetching product by handle:', error);
    return null;
  }
}

/**
 * Fetch products by collection
 */
export async function fetchShopifyProductsByCollection(
  collectionHandle: string,
  limit = 50
): Promise<ShopifyProduct[]> {
  const query = `
    query GetCollection($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                    sku
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { handle: collectionHandle, first: limit },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data?.collectionByHandle?.products) {
      return [];
    }

    return data.data.collectionByHandle.products.edges.map((edge: any) => edge.node);
  } catch (error) {
    console.error('Error fetching products by collection:', error);
    return [];
  }
}

/**
 * Convert Shopify product to your app's Product format
 */
export function convertShopifyProduct(shopifyProduct: ShopifyProduct) {
  const firstVariant = shopifyProduct.variants.edges[0]?.node;
  const firstImage = shopifyProduct.images.edges[0]?.node;

  return {
    id: shopifyProduct.handle,
    variantId: firstVariant?.id || '',
    title: shopifyProduct.title,
    description: shopifyProduct.description,
    price: parseFloat(firstVariant?.price.amount || '0'),
    currency: firstVariant?.price.currencyCode || 'INR',
    image: firstImage?.url || null,
    available: shopifyProduct.availableForSale && (firstVariant?.availableForSale || false),
    variants: shopifyProduct.variants.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      price: parseFloat(edge.node.price.amount),
      currency: edge.node.price.currencyCode,
      available: edge.node.availableForSale,
      sku: edge.node.sku,
      image: edge.node.image?.url || null,
    })),
    images: shopifyProduct.images.edges.map(edge => edge.node.url),
  };
}

/**
 * Cache for products to avoid repeated API calls
 */
let productsCache: ShopifyProduct[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch products with caching
 */
export async function fetchShopifyProductsCached(limit = 50): Promise<ShopifyProduct[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (productsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Using cached products');
    return productsCache;
  }

  console.log('Fetching fresh products from Shopify');
  const products = await fetchShopifyProducts(limit);
  
  productsCache = products;
  cacheTimestamp = now;
  
  return products;
}

/**
 * Clear the products cache
 */
export function clearProductsCache(): void {
  productsCache = null;
  cacheTimestamp = null;
}
