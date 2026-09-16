import type { ShiprocketProduct, ShiprocketCollection, PaginatedResponse } from './types';

/**
 * Mock product database - In production, this would be your actual database
 * For now, we'll transform the data from your products.ts file
 */

// This is sample data structure - you'll need to expand this based on your actual products
const mockProducts: ShiprocketProduct[] = [
  {
    id: "samba-og-cloud-white-core-black",
    title: "Samba OG",
    body_html: "<p>The iconic Adidas Samba OG sneaker in Cloud White and Core Black colorway. A timeless classic that never goes out of style.</p>",
    vendor: "Adidas",
    product_type: "Sneakers",
    created_at: new Date().toISOString(),
    handle: "samba-og-cloud-white-core-black",
    updated_at: new Date().toISOString(),
    tags: "Adidas, Samba, Sneakers, Classic",
    status: "active",
    variants: [
      {
        id: "samba-og-cloud-white-core-black-variant-1",
        title: "Cloud White / Core Black",
        price: "10999.00",
        compare_at_price: "12999.00",
        sku: "SAMBA-OG-CW-CB",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        taxable: true,
        quantity: 50,
        grams: 800,
        image: {
          src: "https://assets.adidas.com/images/samba-og-cloud-white.jpg"
        },
        option_values: {
          "Color": "Cloud White / Core Black",
          "Size": "9"
        },
        weight: 0.8,
        weight_unit: "kg"
      }
    ],
    options: [
      {
        name: "Color",
        values: ["Cloud White / Core Black", "Core Black / White", "Off White / Green"]
      },
      {
        name: "Size",
        values: ["7", "8", "9", "10", "11"]
      }
    ],
    image: {
      src: "https://assets.adidas.com/images/samba-og-cloud-white.jpg"
    }
  }
  // Add more products here based on your sambaProducts array
];

const mockCollections: ShiprocketCollection[] = [
  {
    id: "adidas-collection",
    updated_at: new Date().toISOString(),
    body_html: "<p>Explore our curated collection of Adidas sneakers and sportswear.</p>",
    handle: "adidas",
    image: {
      src: "https://assets.adidas.com/images/collection-adidas.jpg"
    },
    title: "Adidas Collection",
    created_at: new Date().toISOString()
  },
  {
    id: "samba-collection",
    updated_at: new Date().toISOString(),
    body_html: "<p>The iconic Samba series - timeless classics for every occasion.</p>",
    handle: "samba",
    image: {
      src: "https://assets.adidas.com/images/collection-samba.jpg"
    },
    title: "Samba Collection",
    created_at: new Date().toISOString()
  }
];

/**
 * Fetch all products with pagination
 */
export function fetchProducts(page = 1, limit = 100): PaginatedResponse<ShiprocketProduct> {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = mockProducts.slice(startIndex, endIndex);

  return {
    total: mockProducts.length,
    products: paginatedProducts
  };
}

/**
 * Fetch all collections with pagination
 */
export function fetchCollections(page = 1, limit = 100): PaginatedResponse<ShiprocketCollection> {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCollections = mockCollections.slice(startIndex, endIndex);

  return {
    total: mockCollections.length,
    collections: paginatedCollections
  };
}

/**
 * Fetch products by collection ID with pagination
 */
export function fetchProductsByCollection(
  collectionId: string,
  page = 1,
  limit = 100
): PaginatedResponse<ShiprocketProduct> {
  // Filter products by collection - this is simplified
  // In production, you'd have proper collection-product relationships
  const collectionProducts = mockProducts.filter(product => {
    // Simple logic: if collection is 'adidas', return adidas products
    if (collectionId === 'adidas-collection') {
      return product.vendor === 'Adidas';
    }
    if (collectionId === 'samba-collection') {
      return product.title.toLowerCase().includes('samba');
    }
    return false;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = collectionProducts.slice(startIndex, endIndex);

  return {
    total: collectionProducts.length,
    products: paginatedProducts
  };
}

/**
 * Find a product by ID
 */
export function findProductById(productId: string): ShiprocketProduct | undefined {
  return mockProducts.find(p => p.id.toString() === productId);
}

/**
 * Find a collection by ID
 */
export function findCollectionById(collectionId: string): ShiprocketCollection | undefined {
  return mockCollections.find(c => c.id.toString() === collectionId);
}

/**
 * Update or create a product (for webhook sync)
 */
export function upsertProduct(product: ShiprocketProduct): boolean {
  const index = mockProducts.findIndex(p => p.id.toString() === product.id.toString());
  
  if (index >= 0) {
    // Update existing product
    mockProducts[index] = product;
  } else {
    // Add new product
    mockProducts.push(product);
  }
  
  return true;
}

/**
 * Update or create a collection (for webhook sync)
 */
export function upsertCollection(collection: ShiprocketCollection): boolean {
  const index = mockCollections.findIndex(c => c.id.toString() === collection.id.toString());
  
  if (index >= 0) {
    // Update existing collection
    mockCollections[index] = collection;
  } else {
    // Add new collection
    mockCollections.push(collection);
  }
  
  return true;
}
