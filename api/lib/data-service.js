const { config } = require('./config');

/**
 * Shopify Storefront API reads, shaped the way Shiprocket's catalogue APIs expect.
 */

const STOREFRONT_API = '2024-01';

const PRODUCT_FIELDS = `
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
        price { amount }
        compareAtPrice { amount }
        sku
        availableForSale
        weight
        weightUnit
        image { url }
        selectedOptions { name value }
      }
    }
  }
  options { name values }
  featuredImage { url }
`;

async function storefrontQuery(query, variables = {}) {
  const response = await fetch(`${config.shopifyStoreDomain}/api/${STOREFRONT_API}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.shopifyStorefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

// Follows Storefront cursors so stores with more than 250 items are read in full
async function fetchAllPages(query, variables, getConnection) {
  const nodes = [];
  let after = null;
  do {
    const connection = getConnection(await storefrontQuery(query, { ...variables, after }));
    if (!connection) break;
    nodes.push(...connection.edges.map(edge => edge.node));
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

const WEIGHT_TO_GRAMS = { GRAMS: 1, KILOGRAMS: 1000, OUNCES: 28.3495, POUNDS: 453.592 };

function toGrams(weight, unit) {
  if (!weight) return 0;
  return Math.round(weight * (WEIGHT_TO_GRAMS[unit] || 1000));
}

const numericId = gid => gid.split('/').pop();

function transformProduct(product) {
  return {
    id: numericId(product.id),
    title: product.title,
    body_html: product.descriptionHtml || '',
    vendor: product.vendor || '',
    product_type: product.productType || '',
    created_at: product.createdAt,
    handle: product.handle,
    updated_at: product.updatedAt,
    tags: product.tags.join(', '),
    status: 'active',
    variants: product.variants.edges.map(({ node: variant }) => {
      const grams = toGrams(variant.weight, variant.weightUnit) || config.defaultWeightGrams;
      return {
        id: numericId(variant.id),
        title: variant.title,
        price: parseFloat(variant.price.amount).toFixed(2),
        compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount).toFixed(2) : null,
        sku: variant.sku || '',
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        taxable: true,
        // The Storefront token can't read stock levels; expose sold-out variants as 0 so
        // Shiprocket won't sell them
        quantity: variant.availableForSale === false ? 0 : 999,
        grams,
        image: variant.image ? { src: variant.image.url } : null,
        option_values: Object.fromEntries(variant.selectedOptions.map(opt => [opt.name, opt.value])),
        weight: grams / 1000,
        weight_unit: 'kg',
      };
    }),
    options: product.options.map(opt => ({ name: opt.name, values: opt.values })),
    image: product.featuredImage ? { src: product.featuredImage.url } : null,
  };
}

function transformCollection(collection) {
  return {
    id: numericId(collection.id),
    updated_at: collection.updatedAt,
    body_html: collection.descriptionHtml || '',
    handle: collection.handle,
    image: collection.image ? { src: collection.image.url } : null,
    title: collection.title,
    // Storefront API has no collection createdAt
    created_at: collection.updatedAt,
  };
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit;
  return { total: items.length, items: items.slice(start, start + limit) };
}

async function fetchProducts(page = 1, limit = 100) {
  const products = await fetchAllPages(
    `query ($after: String) {
      products(first: 250, after: $after) {
        edges { node { ${PRODUCT_FIELDS} } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
    {},
    data => data.products
  );
  const { total, items } = paginate(products.map(transformProduct), page, limit);
  return { total, products: items };
}

async function fetchCollections(page = 1, limit = 100) {
  const collections = await fetchAllPages(
    `query ($after: String) {
      collections(first: 250, after: $after) {
        edges { node { id title handle descriptionHtml updatedAt image { url } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
    {},
    data => data.collections
  );
  const { total, items } = paginate(collections.map(transformCollection), page, limit);
  return { total, collections: items };
}

/**
 * collectionId must be numeric (validated by the caller); unknown IDs return an empty list.
 */
async function fetchProductsByCollection(collectionId, page = 1, limit = 100) {
  const products = await fetchAllPages(
    `query ($id: ID!, $after: String) {
      collection(id: $id) {
        products(first: 250, after: $after) {
          edges { node { ${PRODUCT_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }`,
    { id: `gid://shopify/Collection/${collectionId}` },
    data => data.collection && data.collection.products
  );
  const { total, items } = paginate(products.map(transformProduct), page, limit);
  return { total, products: items };
}

/**
 * Look up variants by numeric ID for checkout: the live price, title and image come from
 * Shopify, never from the browser. Returns a Map of numeric ID -> variant (missing IDs absent).
 */
async function fetchVariantsByIds(variantIds) {
  const data = await storefrontQuery(
    `query ($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          title
          availableForSale
          price { amount }
          image { url }
          product { title featuredImage { url } }
        }
      }
    }`,
    { ids: variantIds.map(id => `gid://shopify/ProductVariant/${id}`) }
  );

  const variants = new Map();
  for (const node of data.nodes) {
    if (node && node.id) variants.set(numericId(node.id), node);
  }
  return variants;
}

module.exports = {
  fetchProducts,
  fetchCollections,
  fetchProductsByCollection,
  fetchVariantsByIds,
};
