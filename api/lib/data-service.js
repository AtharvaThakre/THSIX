/**
 * Shopify Storefront API client for fetching real products
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'https://19sjnp-gx.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'be59fa0cf086500d7b6456e64f233866';

/**
 * Fetch products from Shopify Storefront API
 */
async function fetchProductsFromShopify(limit = 250) {
  const query = `
    {
      products(first: ${limit}) {
        edges {
          node {
            id
            title
            descriptionHtml
            vendor
            productType
            handle
            createdAt
            updatedAt
            tags
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                  }
                  compareAtPrice {
                    amount
                  }
                  sku
                  availableForSale
                  weight
                  weightUnit
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
            options {
              name
              values
            }
            featuredImage {
              url
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.products.edges.map(edge => transformShopifyProduct(edge.node));
}

/**
 * Fetch collections from Shopify Storefront API
 */
async function fetchCollectionsFromShopify(limit = 250) {
  const query = `
    {
      collections(first: ${limit}) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            updatedAt
            image {
              url
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.collections.edges.map(edge => transformShopifyCollection(edge.node));
}

/**
 * Transform Shopify product to Shiprocket format
 */
function transformShopifyProduct(shopifyProduct) {
  // Extract numeric ID from Shopify's global ID (gid://shopify/Product/123456)
  const id = shopifyProduct.id.split('/').pop();
  
  return {
    id: id,
    title: shopifyProduct.title,
    body_html: shopifyProduct.descriptionHtml || '',
    vendor: shopifyProduct.vendor || '',
    product_type: shopifyProduct.productType || '',
    created_at: shopifyProduct.createdAt,
    handle: shopifyProduct.handle,
    updated_at: shopifyProduct.updatedAt,
    tags: shopifyProduct.tags.join(', '),
    status: 'active',
    variants: shopifyProduct.variants.edges.map(variantEdge => {
      const variant = variantEdge.node;
      const variantId = variant.id.split('/').pop();
      
      return {
        id: variantId,
        title: variant.title,
        price: parseFloat(variant.price.amount).toFixed(2),
        compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount).toFixed(2) : null,
        sku: variant.sku || '',
        created_at: shopifyProduct.createdAt,
        updated_at: shopifyProduct.updatedAt,
        taxable: true,
        // The Storefront token can't read stock levels; expose sold-out variants as 0 so
        // Shiprocket won't sell them
        quantity: variant.availableForSale === false ? 0 : 999,
        grams: variant.weight ? Math.round(variant.weight * 1000) : 0,
        image: variant.image ? { src: variant.image.url } : null,
        option_values: variant.selectedOptions.reduce((acc, opt) => {
          acc[opt.name] = opt.value;
          return acc;
        }, {}),
        weight: variant.weight || 0,
        weight_unit: variant.weightUnit ? variant.weightUnit.toLowerCase() : 'kg'
      };
    }),
    options: shopifyProduct.options.map(opt => ({
      name: opt.name,
      values: opt.values
    })),
    image: shopifyProduct.featuredImage ? { src: shopifyProduct.featuredImage.url } : null
  };
}

/**
 * Transform Shopify collection to Shiprocket format
 */
function transformShopifyCollection(shopifyCollection) {
  const id = shopifyCollection.id.split('/').pop();
  
  return {
    id: id,
    updated_at: shopifyCollection.updatedAt,
    body_html: shopifyCollection.descriptionHtml || '',
    handle: shopifyCollection.handle,
    image: shopifyCollection.image ? { src: shopifyCollection.image.url } : null,
    title: shopifyCollection.title,
    created_at: shopifyCollection.updatedAt
  };
}

/**
 * Fetch all products with pagination
 */
async function fetchProducts(page = 1, limit = 100) {
  try {
    const allProducts = await fetchProductsFromShopify(250);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    return {
      total: allProducts.length,
      products: paginatedProducts
    };
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    throw error;
  }
}

/**
 * Fetch all collections with pagination
 */
async function fetchCollections(page = 1, limit = 100) {
  try {
    const allCollections = await fetchCollectionsFromShopify(250);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCollections = allCollections.slice(startIndex, endIndex);

    return {
      total: allCollections.length,
      collections: paginatedCollections
    };
  } catch (error) {
    console.error('Error fetching collections from Shopify:', error);
    throw error;
  }
}

/**
 * Fetch products by collection ID with pagination
 */
async function fetchProductsByCollection(collectionId, page = 1, limit = 100) {
  try {
    const query = `
      {
        collection(id: "gid://shopify/Collection/${collectionId}") {
          products(first: 250) {
            edges {
              node {
                id
                title
                descriptionHtml
                vendor
                productType
                handle
                createdAt
                updatedAt
                tags
                variants(first: 250) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                      }
                      compareAtPrice {
                        amount
                      }
                      sku
                      availableForSale
                      weight
                      weightUnit
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
                options {
                  name
                  values
                }
                featuredImage {
                  url
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data.collection) {
      return {
        total: 0,
        products: []
      };
    }

    const allProducts = data.data.collection.products.edges.map(edge => transformShopifyProduct(edge.node));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    return {
      total: allProducts.length,
      products: paginatedProducts
    };
  } catch (error) {
    console.error('Error fetching products by collection from Shopify:', error);
    throw error;
  }
}

module.exports = {
  fetchProducts,
  fetchCollections,
  fetchProductsByCollection
};
