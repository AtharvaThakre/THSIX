import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ShopifyContextType {
  isLoaded: boolean;
  error: string | null;
}

const ShopifyContext = createContext<ShopifyContextType>({
  isLoaded: false,
  error: null,
});

export const useShopify = () => {
  const context = useContext(ShopifyContext);
  if (!context) {
    throw new Error('useShopify must be used within ShopifyProvider');
  }
  return context;
};

interface ShopifyProviderProps {
  children: ReactNode;
}

export const ShopifyProvider = ({ children }: ShopifyProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initShopify = async () => {
      try {
        // Load Shopify web components if not already loaded
        if (!(window as any).customElements?.get('shopify-store')) {
          // Wait for the global Shopify object
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait
          
          while (!(window as any).Shopify && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (!(window as any).Shopify) {
            throw new Error('Shopify web components failed to load');
          }
        }

        // Initialize Shopify context
        const shopifyElement = document.querySelector('shopify-store') as any;
        if (shopifyElement) {
          // Wait for the element to be ready
          await new Promise(resolve => {
            const checkReady = setInterval(() => {
              if (shopifyElement.isReady || shopifyElement.initialized) {
                clearInterval(checkReady);
                resolve(true);
              }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkReady);
              resolve(true);
            }, 5000);
          });
        }

        setIsLoaded(true);
      } catch (err) {
        console.error('Shopify initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Shopify');
        // Still mark as loaded to prevent infinite loading state
        setIsLoaded(true);
      }
    };

    initShopify();
  }, []);

  return (
    <ShopifyContext.Provider value={{ isLoaded, error }}>
      {children}
    </ShopifyContext.Provider>
  );
};
