/**
 * Shiprocket Product Variant structure
 */
export interface ShiprocketVariant {
  id: string | number;
  title: string;
  price: string;
  compare_at_price?: string;
  sku: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  quantity: number;
  grams: number;
  image: {
    src: string;
  };
  option_values: Record<string, string>;
  weight: number;
  weight_unit: string;
}

/**
 * Shiprocket Product Option structure
 */
export interface ShiprocketOption {
  name: string;
  values: string[];
}

/**
 * Shiprocket Product structure (as per API documentation)
 */
export interface ShiprocketProduct {
  id: string | number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  tags: string;
  status: 'active' | 'draft' | 'archived';
  variants: ShiprocketVariant[];
  options: ShiprocketOption[];
  image: {
    src: string;
  };
}

/**
 * Shiprocket Collection structure
 */
export interface ShiprocketCollection {
  id: string | number;
  updated_at: string;
  body_html: string;
  handle: string;
  image: {
    src: string;
  };
  title: string;
  created_at: string;
}

/**
 * Cart data structure for checkout
 */
export interface CheckoutCartItem {
  variant_id: string;
  quantity: number;
}

export interface CheckoutCartData {
  items: CheckoutCartItem[];
}

/**
 * Access token request/response
 */
export interface AccessTokenRequest {
  cart_data: CheckoutCartData;
  redirect_url: string;
  timestamp: string;
}

export interface AccessTokenResponse {
  token: string;
  order_id: string;
}

/**
 * Order webhook payload
 */
export interface OrderWebhookPayload {
  order_id: string;
  cart_data: CheckoutCartData;
  redirect_url: string;
  status: 'CREATED' | 'INITIATED' | 'FAILED' | 'SUCCESS';
  source: 'web' | 'm-web';
  phone: string;
  email: string;
  shipping_plan?: string;
  shipping_address?: any;
  billing_address?: any;
  payment_type: 'CASH_ON_DELIVERY' | 'PREPAID';
  payment_status: 'Pending' | 'Success' | 'Failed';
  total_amount_payable: number;
  subtotal_price?: number;
  shipping_charges?: number;
  cod_charges?: number;
  total_discount?: number;
  coupon_codes?: string[];
  [key: string]: any;
}

/**
 * Order details request
 */
export interface OrderDetailsRequest {
  order_id: string;
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  total: number;
  products?: T[];
  collections?: T[];
}
