/**
 * Mock product database - In production, this would be your actual database
 * For now, we'll transform the data from your products.ts file
 */

// This is sample data structure - you'll need to expand this based on your actual products
const mockProducts = [
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
  }
];

const mockCollections = [
  {
    id: "adidas-collection",
    updated_at: new Date().toISOString(),
    body_html: "<p>Explore our curated collection of Adidas sneakers and sportswear.</p>",
    handle: "adidas",
    image: {
      src: "/assets/logos/adidas-logo.png"
    },
    title: "Adidas Collection",
    created_at: new Date().toISOString()
  }
];

/**
 * Fetch all products with pagination
 */
function fetchProducts(page = 1, limit = 100) {
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
function fetchCollections(page = 1, limit = 100) {
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
function fetchProductsByCollection(collectionId, page = 1, limit = 100) {
  const collectionProducts = mockProducts.filter(product => {
    if (collectionId === 'adidas-collection') {
      return product.vendor === 'Adidas';
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

module.exports = {
  fetchProducts,
  fetchCollections,
  fetchProductsByCollection
};