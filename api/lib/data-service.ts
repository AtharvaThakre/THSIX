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
          src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Samba_OG_Shoes_White_B75806.jpg"
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
      src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Samba_OG_Shoes_White_B75806.jpg"
    }
  },
  {
    id: "samba-og-core-black-white",
    title: "Samba OG",
    body_html: "<p>The iconic Adidas Samba OG sneaker in Core Black and White colorway. Classic styling with modern comfort.</p>",
    vendor: "Adidas",
    product_type: "Sneakers",
    created_at: new Date().toISOString(),
    handle: "samba-og-core-black-white",
    updated_at: new Date().toISOString(),
    tags: "Adidas, Samba, Sneakers, Classic, Black",
    status: "active",
    variants: [
      {
        id: "samba-og-core-black-white-variant-1",
        title: "Core Black / White",
        price: "10999.00",
        compare_at_price: null,
        sku: "SAMBA-OG-CB-W",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        taxable: true,
        quantity: 35,
        grams: 800,
        image: {
          src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/d69d0dfd4bc24bb4b39bada600f34bb8_9366/Samba_OG_Shoes_Black_B75807.jpg"
        },
        option_values: {
          "Color": "Core Black / White",
          "Size": "9"
        },
        weight: 0.8,
        weight_unit: "kg"
      }
    ],
    options: [
      {
        name: "Color",
        values: ["Core Black / White"]
      },
      {
        name: "Size",
        values: ["7", "8", "9", "10", "11"]
      }
    ],
    image: {
      src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/d69d0dfd4bc24bb4b39bada600f34bb8_9366/Samba_OG_Shoes_Black_B75807.jpg"
    }
  },
  {
    id: "samba-og-off-white-green",
    title: "Samba OG",
    body_html: "<p>The iconic Adidas Samba OG sneaker in Off White and Green colorway. A fresh take on the classic design.</p>",
    vendor: "Adidas",
    product_type: "Sneakers",
    created_at: new Date().toISOString(),
    handle: "samba-og-off-white-green",
    updated_at: new Date().toISOString(),
    tags: "Adidas, Samba, Sneakers, Classic, Green",
    status: "active",
    variants: [
      {
        id: "samba-og-off-white-green-variant-1",
        title: "Off White / Green",
        price: "10999.00",
        compare_at_price: "11999.00",
        sku: "SAMBA-OG-OW-G",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        taxable: true,
        quantity: 25,
        grams: 800,
        image: {
          src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/a7109bca4b9c46af8de2ad2b00b3f2f0_9366/Samba_OG_Shoes_White_IF1950.jpg"
        },
        option_values: {
          "Color": "Off White / Green",
          "Size": "9"
        },
        weight: 0.8,
        weight_unit: "kg"
      }
    ],
    options: [
      {
        name: "Color",
        values: ["Off White / Green"]
      },
      {
        name: "Size",
        values: ["7", "8", "9", "10", "11"]
      }
    ],
    image: {
      src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/a7109bca4b9c46af8de2ad2b00b3f2f0_9366/Samba_OG_Shoes_White_IF1950.jpg"
    }
  },
  {
    id: "gazelle-indoor-black-white",
    title: "Gazelle Indoor",
    body_html: "<p>The Adidas Gazelle Indoor brings retro style to the modern day. Featuring a suede upper and classic design.</p>",
    vendor: "Adidas",
    product_type: "Sneakers",
    created_at: new Date().toISOString(),
    handle: "gazelle-indoor-black-white",
    updated_at: new Date().toISOString(),
    tags: "Adidas, Gazelle, Sneakers, Retro, Suede",
    status: "active",
    variants: [
      {
        id: "gazelle-indoor-black-white-variant-1",
        title: "Core Black / Cloud White",
        price: "9999.00",
        compare_at_price: null,
        sku: "GAZELLE-IND-CB-CW",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        taxable: true,
        quantity: 40,
        grams: 750,
        image: {
          src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/b41672_01_standard/Gazelle_Indoor_Shoes_Black_B41672.jpg"
        },
        option_values: {
          "Color": "Core Black / Cloud White",
          "Size": "9"
        },
        weight: 0.75,
        weight_unit: "kg"
      }
    ],
    options: [
      {
        name: "Color",
        values: ["Core Black / Cloud White"]
      },
      {
        name: "Size",
        values: ["7", "8", "9", "10", "11"]
      }
    ],
    image: {
      src: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/b41672_01_standard/Gazelle_Indoor_Shoes_Black_B41672.jpg"
    }
  }
];

const mockCollections: ShiprocketCollection[] = [
  {
    id: "adidas-collection",
    updated_at: new Date().toISOString(),
    body_html: "<p>Explore our curated collection of Adidas sneakers and sportswear. From the iconic Samba OG to the classic Gazelle, discover timeless designs that blend heritage with modern style.</p>",
    handle: "adidas",
    image: {
      src: "/assets/logos/adidas-logo.png"
    },
    title: "Adidas Collection",
    created_at: new Date().toISOString()
  },
  {
    id: "samba-collection",
    updated_at: new Date().toISOString(),
    body_html: "<p>The iconic Samba series - timeless classics for every occasion. Originally designed for indoor soccer, now a streetwear staple loved worldwide.</p>",
    handle: "samba",
    image: {
      src: "/assets/products/adidas.png"
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
