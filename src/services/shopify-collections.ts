/**
 * Shopify Collections Service
 * Fetches collections and their products from Shopify Storefront API
 */

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '19sjnp-gx.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'be59fa0cf086500d7b6456e64f233866';

// Debug logging
console.log('Shopify Domain:', SHOPIFY_DOMAIN);
console.log('Access Token Available:', !!STOREFRONT_ACCESS_TOKEN);

if (!SHOPIFY_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
  console.error('Shopify configuration missing!');
  console.error('SHOPIFY_DOMAIN:', SHOPIFY_DOMAIN);
  console.error('STOREFRONT_ACCESS_TOKEN:', STOREFRONT_ACCESS_TOKEN ? 'Present' : 'Missing');
}

const SHOPIFY_STOREFRONT_API_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: {
    url: string;
    altText: string | null;
  } | null;
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

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
  compareAtPriceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  } | null;
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
        compareAtPrice: {
          amount: string;
          currencyCode: string;
        } | null;
        availableForSale: boolean;
        sku: string | null;
        image: {
          url: string;
        } | null;
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
      };
    }>;
  };
  availableForSale: boolean;
  vendor: string;
}

/**
 * Fetch collection by handle
 */
export async function fetchShopifyCollection(handle: string): Promise<ShopifyCollection | null> {
  const query = `
    query GetCollection($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              availableForSale
              vendor
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
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
              variants(first: 20) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    sku
                    image {
                      url
                    }
                    selectedOptions {
                      name
                      value
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
        variables: { handle, first: 50 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }
    
    return data.data?.collectionByHandle || null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

/**
 * Fetch all collections
 */
export async function fetchShopifyCollections(limit = 20): Promise<ShopifyCollection[]> {
  const query = `
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
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

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    return data.data?.collections?.edges?.map((edge: any) => edge.node) || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

/**
 * Convert Shopify product to app format
 */
export function convertShopifyProductFromCollection(shopifyProduct: ShopifyProduct) {
  const firstVariant = shopifyProduct.variants.edges[0]?.node;
  const firstImage = shopifyProduct.images.edges[0]?.node;

  // Get color from variant options
  const colorOption = firstVariant?.selectedOptions?.find(option => 
    option.name.toLowerCase().includes('color') || 
    option.name.toLowerCase().includes('colour')
  );

  // Get size from variant options
  const sizeOption = firstVariant?.selectedOptions?.find(option => 
    option.name.toLowerCase().includes('size')
  );

  return {
    id: shopifyProduct.id,
    title: shopifyProduct.title,
    handle: shopifyProduct.handle,
    description: shopifyProduct.description,
    vendor: shopifyProduct.vendor,
    image: {
      src: firstImage?.url || null
    },
    variants: shopifyProduct.variants.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      price: edge.node.price.amount,
      compare_at_price: edge.node.compareAtPrice?.amount || null,
      option_values: {
        Color: colorOption?.value || edge.node.title,
        Size: sizeOption?.value || '',
        ...Object.fromEntries(
          edge.node.selectedOptions?.map(opt => [opt.name, opt.value]) || []
        )
      }
    })),
    available: shopifyProduct.availableForSale,
    priceRange: {
      min: parseFloat(shopifyProduct.priceRange.minVariantPrice.amount),
      currency: shopifyProduct.priceRange.minVariantPrice.currencyCode
    },
    compareAtPriceRange: shopifyProduct.compareAtPriceRange ? {
      min: parseFloat(shopifyProduct.compareAtPriceRange.minVariantPrice.amount),
      currency: shopifyProduct.compareAtPriceRange.minVariantPrice.currencyCode
    } : null
  };
}

export type { ShopifyCollection, ShopifyProduct };