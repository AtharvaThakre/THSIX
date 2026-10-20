import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { trackAddToCart, trackCustomEvent } from '../utils/metaPixel';
import { trackGA4AddToCart } from '../utils/ga4';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string; // Numeric Shopify variant ID for checkout
  variantTitle?: string; // Human-readable variant name (e.g., "UK7")
  handle?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isItemInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + 1,
          totalPrice: state.totalPrice + action.payload.price,
        };
      } else {
        const newItem = { ...action.payload, quantity: 1 };
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + 1,
          totalPrice: state.totalPrice + action.payload.price,
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.id === action.payload);
      if (!itemToRemove) return state;
      
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalPrice: state.totalPrice - (itemToRemove.price * itemToRemove.quantity),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(item => item.id === action.payload.id);
      if (!item) return state;
      
      const quantityDiff = action.payload.quantity - item.quantity;
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDiff,
        totalPrice: state.totalPrice + (item.price * quantityDiff),
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    
    case 'LOAD_CART': {
      const totalItems = action.payload.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        items: action.payload,
        totalItems,
        totalPrice,
      };
    }
    
    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'thsix_cart';

/** Reads and validates the saved cart; drops corrupt or invalid data. */
function readStoredCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return [];
    const parsedCart: CartItem[] = JSON.parse(savedCart);
    // Validate the cart data before loading
    const validCart = Array.isArray(parsedCart)
      ? parsedCart.filter(item =>
          item &&
          item.id &&
          item.title &&
          typeof item.price === 'number' &&
          item.price >= 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
        )
      : [];
    if (validCart.length === 0) {
      // Clear invalid cart data
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    return validCart;
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    // Clear corrupted cart data
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* storage unavailable */ }
    return [];
  }
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // The server renders an empty cart; the saved cart is loaded after hydration.
  // Until then nothing is written back, so the empty initial state can't overwrite it.
  const hydrated = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = readStoredCart();
    if (saved.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: saved });
    }
    hydrated.current = true;

    // Keep other tabs in sync (e.g. cart cleared on the checkout success tab)
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        dispatch({ type: 'LOAD_CART', payload: readStoredCart() });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    trackAddToCart({
      content_name: item.title,
      content_ids: [item.variantId || item.id],
      value: item.price,
    });
    trackGA4AddToCart({
      item_id: item.variantId || item.id,
      item_name: item.title,
      item_variant: item.variantTitle || '',
      price: item.price,
      quantity: 1,
    });
  };

  const removeItem = (id: string) => {
    const item = state.items.find(i => i.id === id);
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    if (item) {
      trackCustomEvent('RemoveFromCart', {
        content_name: item.title,
        content_ids: [item.variantId || item.id],
        value: item.price,
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  // Stable identity: CheckoutSuccess calls this from an effect that depends on it.
  // It also clears storage directly: on a fresh page load the success page's effect runs
  // before this provider's load effect, which would otherwise restore the saved cart.
  const clearCart = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch { /* storage unavailable */ }
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const isItemInCart = (id: string) => {
    return state.items.some(item => item.id === id);
  };

  const contextValue: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isItemInCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};