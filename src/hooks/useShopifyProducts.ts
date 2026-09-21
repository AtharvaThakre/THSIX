/**
 * React Hook for fetching Shopify products
 * Automatically updates when products change in Shopify
 */

import { useState, useEffect } from 'react';
import { 
  fetchShopifyProductsCached, 
  fetchShopifyProductByHandle,
  fetchShopifyProductsByCollection,
  convertShopifyProduct,
  clearProductsCache
} from '../services/shopify-products';

interface UseShopifyProductsOptions {
  collectionHandle?: string;
  autoFetch?: boolean;
}

export function useShopifyProducts(options: UseShopifyProductsOptions = {}) {
  const { collectionHandle, autoFetch = true } = options;
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      let shopifyProducts;
      
      if (collectionHandle) {
        shopifyProducts = await fetchShopifyProductsByCollection(collectionHandle);
      } else {
        shopifyProducts = await fetchShopifyProductsCached();
      }

      const convertedProducts = shopifyProducts.map(convertShopifyProduct);
      setProducts(convertedProducts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [collectionHandle, autoFetch]);

  const refetch = () => {
    clearProductsCache();
    return fetchProducts();
  };

  return {
    products,
    loading,
    error,
    refetch,
  };
}

export function useShopifyProduct(handle: string) {
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const shopifyProduct = await fetchShopifyProductByHandle(handle);
        
        if (shopifyProduct) {
          setProduct(convertShopifyProduct(shopifyProduct));
        } else {
          setProduct(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (handle) {
      fetchProduct();
    }
  }, [handle]);

  return {
    product,
    loading,
    error,
  };
}
