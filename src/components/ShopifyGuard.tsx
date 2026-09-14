import { ReactNode, useEffect, useState } from 'react';

interface ShopifyGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ShopifyGuard component ensures that children are only rendered 
 * after Shopify web components are properly loaded and initialized.
 * 
 * This prevents "Component is not in a context template" errors.
 */
export const ShopifyGuard = ({ children, fallback }: ShopifyGuardProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkShopifyReady = async () => {
      try {
        // Wait for shopify-store element to exist and be initialized
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds max wait

        while (attempts < maxAttempts) {
          const shopifyStore = document.querySelector('shopify-store') as any;
          
          if (shopifyStore && shopifyStore.isReady !== false) {
            // Add a small delay to ensure all Shopify APIs are available
            await new Promise(resolve => setTimeout(resolve, 200));
            setIsReady(true);
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }

        // Force ready after timeout to avoid infinite loading
        console.warn('Shopify components took too long to load, proceeding anyway');
        setIsReady(true);
      } catch (error) {
        console.warn('Error waiting for Shopify:', error);
        setIsReady(true);
      }
    };

    // Give the browser a chance to render the shopify-store element first
    const timeoutId = setTimeout(checkShopifyReady, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isReady) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
