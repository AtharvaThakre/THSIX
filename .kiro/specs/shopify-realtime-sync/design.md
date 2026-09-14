# Design Specification: Shopify Real-Time E-Commerce Platform

**Version:** 1.0  
**Date:** 2024-12-17  
**Status:** Draft

## Overview

Transform the THSIX e-commerce platform into a fully real-time synchronized system that instantly reflects all Shopify store changes in the React frontend. This addresses critical console errors while implementing WebSocket-based live updates, webhook-triggered cache invalidation, and real-time inventory warnings.

### Current Problems
1. **Invalid Shopify Query Syntax:** `product.title.includes('SAMBA')` causes parsing errors
2. **Context Template Problems:** Components not properly wrapped in context templates
3. **React/Shopify Integration:** Script tag conflicts and context errors
4. **No Real-Time Sync:** Static data loading without live updates
5. **Error Handling:** Missing fallbacks for failed API calls

### Solution Goals
- Fix all existing Shopify integration errors immediately
- Implement full real-time synchronization between Shopify and React frontend
- Add WebSocket-based live updates for products, inventory, and cart
- Create resilient error handling and offline support
- Maintain performance and user experience during real-time operations

## Architecture

### High-Level System Design
```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Shopify Admin     │    │   WebSocket Server   │    │   React Frontend    │
│                     │    │                      │    │                     │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────────┐ │
│ │ Products        │─┼────┼→│ Webhook Handlers │ │    │ │ Product Cards   │ │
│ │ Inventory       │ │    │ │ Message Router   │─┼────┼→│ Inventory Badge │ │
│ │ Pricing         │ │    │ │ Connection Mgr   │ │    │ │ Cart Component  │ │
│ └─────────────────┘ │    │ └──────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
         │                           │                           │
         └───────────── HTTP Webhooks ─────────┐                │
                                              │                │
                      ┌─────────────────────────────────────────┴────────────┐
                      │              Real-Time Data Flow                     │
                      │                                                      │
                      │ 1. Admin changes product in Shopify                 │
                      │ 2. Shopify sends webhook to server                  │
                      │ 3. Server validates and broadcasts via WebSocket    │
                      │ 4. React frontend receives and updates UI instantly │
                      └──────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend:** React 19.2.8 + TypeScript + Vite
- **State Management:** Zustand + React Query for caching
- **Real-Time:** Socket.IO for WebSocket connections
- **Validation:** Zod for runtime type checking
- **Testing:** Vitest + Testing Library + Playwright
- **Integration:** Shopify Storefront API + Web Components

### Data Flow Architecture
```
Shopify Store Changes
         ↓
    Webhook Event
         ↓
   Server Validation
         ↓
   WebSocket Broadcast
         ↓
   Frontend State Update  
         ↓
   Component Re-render
         ↓
   User Sees Live Update
```

## Components and Interfaces

### Core Interface Definitions

#### WebSocket Manager
```typescript
interface WebSocketManager {
  connect(): Promise<void>
  subscribe(channel: string, callback: MessageCallback): void
  unsubscribe(channel: string): void
  reconnect(): void
  getConnectionStatus(): ConnectionStatus
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'
type MessageCallback = (data: WebSocketMessage) => void

interface WebSocketMessage {
  type: string
  channel: string
  data: any
  timestamp: string
}
```

#### Shopify Data Store  
```typescript
interface ShopifyStore {
  // State
  products: Map<string, Product>
  inventory: Map<string, InventoryItem>
  cart: CartState
  connectionStatus: ConnectionStatus
  
  // Actions
  updateProduct(product: Product): void
  updateInventory(variantId: string, quantity: number): void
  syncCart(): Promise<void>
  invalidateCache(resource: string, id: string): void
}

interface Product {
  id: string
  handle: string
  title: string
  vendor: string
  price: number
  images: string[]
  variants: ProductVariant[]
  updatedAt: string
  availableForSale: boolean
}

interface InventoryItem {
  variantId: string
  productId: string
  quantity: number
  reserved: number
  threshold: number
  updatedAt: string
}

interface CartState {
  id: string
  items: CartItem[]
  total: number
  updatedAt: string
  synced: boolean
}
```

### Component Architecture

#### Smart Component Wrappers
```typescript
// Replace direct shopify-* usage with intelligent wrappers
interface SmartProductCardProps {
  productId: string
  showInventory?: boolean
  enableRealTimeUpdates?: boolean
}

interface SmartInventoryBadgeProps {
  variantId: string
  threshold?: number
  showQuantity?: boolean
}

interface SmartPriceDisplayProps {
  variantId: string  
  showCompareAtPrice?: boolean
  currency?: string
}
```

#### Provider Hierarchy
```typescript
// Context provider structure
<ShopifyProvider storeConfig={config}>
  <WebSocketProvider url={wsUrl}>
    <ProductsProvider>
      <CartProvider>
        <InventoryProvider>
          <App />
        </InventoryProvider>
      </CartProvider>
    </ProductsProvider>
  </WebSocketProvider>
</ShopifyProvider>
```

#### Error Boundary System
```typescript
interface ShopifyErrorBoundary {
  fallbackUI: React.ComponentType<ErrorFallbackProps>
  onError: (error: Error, errorInfo: ErrorInfo) => void
  retryAttempts: number
  resetOnPropsChange?: boolean
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  retryCount: number
}
```

### WebSocket Message Protocols

#### Product Update Messages
```typescript
interface ProductUpdateMessage {
  type: 'product:created' | 'product:updated' | 'product:deleted'
  product: {
    id: string
    handle: string
    title: string
    vendor: string
    price: number
    images: string[]
    variants: ProductVariant[]
    updatedAt: string
  }
}
```

#### Inventory Update Messages
```typescript
interface InventoryUpdateMessage {
  type: 'inventory:updated'
  variant: {
    id: string
    productId: string
    quantity: number
    reserved: number
    threshold: number
    updatedAt: string
  }
}
```

#### Cart Sync Messages
```typescript
interface CartSyncMessage {
  type: 'cart:updated'
  cart: {
    id: string
    items: CartItem[]
    total: number
    updatedAt: string
  }
  userId: string
}
```

## Data Models

### Product Data Model
```typescript
interface Product {
  id: string                    // Shopify Product ID
  handle: string               // URL handle
  title: string                // Product name
  description: string          // Product description
  descriptionHtml: string      // Rich HTML description
  vendor: string               // Brand/vendor name
  productType: string          // Product category
  tags: string[]              // Product tags
  images: ProductImage[]       // Product images
  variants: ProductVariant[]   // Product variants
  options: ProductOption[]     // Product options (Size, Color, etc.)
  availableForSale: boolean    // Global availability
  createdAt: string           // Creation timestamp
  updatedAt: string           // Last update timestamp
  publishedAt: string         // Publication timestamp
  seo: {
    title: string
    description: string
  }
}

interface ProductVariant {
  id: string
  productId: string
  title: string
  price: number
  compareAtPrice?: number
  sku: string
  barcode?: string
  inventoryQuantity: number
  availableForSale: boolean
  requiresShipping: boolean
  taxable: boolean
  weight: number
  weightUnit: string
  image?: ProductImage
  selectedOptions: SelectedOption[]
  updatedAt: string
}

interface ProductImage {
  id: string
  url: string
  altText?: string
  width: number
  height: number
}

interface ProductOption {
  name: string        // e.g., "Size", "Color"
  values: string[]    // e.g., ["Small", "Medium", "Large"]
}

interface SelectedOption {
  name: string        // e.g., "Size"
  value: string       // e.g., "Large"
}
```

### Inventory Data Model
```typescript
interface InventoryItem {
  variantId: string           // Product variant ID
  productId: string           // Parent product ID
  locationId: string          // Inventory location
  quantity: number            // Available quantity
  reserved: number            // Reserved for orders
  available: number           // quantity - reserved
  threshold: number           // Low stock threshold
  policy: 'deny' | 'continue' // Out of stock policy
  tracked: boolean            // Whether to track inventory
  updatedAt: string          // Last inventory update
}

interface InventoryLocation {
  id: string
  name: string
  address: Address
  fulfillsOnlineOrders: boolean
}

interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'back_in_stock'
  variantId: string
  productTitle: string
  variantTitle: string
  currentQuantity: number
  threshold: number
  timestamp: string
}
```

### Cart Data Model  
```typescript
interface Cart {
  id: string                 // Cart ID
  checkoutUrl: string        // Shopify checkout URL
  items: CartItem[]          // Cart line items
  estimatedCost: {           // Cost breakdown
    totalAmount: number
    subtotalAmount: number
    totalTaxAmount: number
    totalDutyAmount: number
  }
  createdAt: string          // Cart creation time
  updatedAt: string          // Last update time
  synced: boolean            // Sync status
}

interface CartItem {
  id: string                 // Line item ID
  variantId: string          // Product variant
  productId: string          // Product ID
  quantity: number           // Item quantity
  cost: {                    // Item cost details
    totalAmount: number
    amountPerQuantity: number
    compareAtAmountPerQuantity?: number
  }
  merchandise: {             // Item details
    id: string
    title: string
    image?: ProductImage
    product: {
      title: string
      handle: string
    }
  }
  addedAt: string           // When item was added
  updatedAt: string         // Last update time
}
```

### WebSocket Event Models
```typescript
interface WebSocketEvent {
  id: string                // Unique event ID
  type: EventType           // Event type
  channel: string           // Event channel
  data: any                 // Event payload
  timestamp: string         // Event timestamp
  source: 'webhook' | 'admin' | 'user'  // Event source
}

type EventType = 
  | 'product:created'
  | 'product:updated' 
  | 'product:deleted'
  | 'inventory:updated'
  | 'cart:updated'
  | 'cart:item_added'
  | 'cart:item_removed'
  | 'cart:item_updated'
  | 'connection:status'

interface ConnectionEvent {
  type: 'connection:status'
  status: 'connected' | 'disconnected' | 'reconnecting'
  timestamp: string
  reason?: string
}
```

## Error Handling

### Error Categories & Recovery Strategies

#### Network Errors
- **WebSocket Connection Failures**
  - Auto-reconnection with exponential backoff
  - Fallback to HTTP polling mode
  - User notification of connection status
  - Queue updates while disconnected

- **Shopify API Errors**  
  - Retry with exponential backoff
  - Circuit breaker for repeated failures
  - Cached data fallback
  - Rate limit respect and queuing

#### Data Validation Errors
- **Invalid WebSocket Messages**
  - Zod schema validation on all incoming data
  - Malformed message rejection and logging
  - Fallback to last known good state
  - Developer warnings in development mode

- **Shopify Data Inconsistencies**
  - Data sanitization and normalization
  - Conflict resolution (last-write-wins)
  - Manual conflict resolution UI for critical data
  - Audit logging for data discrepancies

#### Component Errors
- **React Component Failures**
  - Error boundaries around all Shopify components
  - Graceful fallback UI components
  - Error reporting to monitoring service
  - Component recovery and retry mechanisms

- **Shopify Web Component Errors**
  - Template validation before rendering
  - Fallback to native HTML components
  - Context availability checking
  - Progressive enhancement approach

#### Business Logic Errors
- **Inventory Conflicts**
  - Real-time inventory validation
  - Cart adjustment notifications
  - Alternative product suggestions
  - Backorder and notification options

- **Cart Synchronization Issues**
  - Optimistic updates with rollback
  - Conflict resolution strategies
  - User notification of changes
  - Manual sync trigger option

### Error Recovery Mechanisms

#### Automatic Recovery
```typescript
interface AutoRecoveryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  circuitBreakerThreshold: number
}

// Example configuration
const recoveryConfig: AutoRecoveryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  backoffFactor: 2,     // Exponential backoff
  circuitBreakerThreshold: 5  // failures before circuit breaks
}
```

#### Manual Recovery
- User-triggered refresh buttons
- "Retry" buttons on error states
- Manual cache invalidation options
- Connection reset capabilities

#### Graceful Degradation
- Progressive enhancement design
- Core functionality without real-time features
- Cached data display during outages
- Clear user communication about reduced functionality

## Correctness Properties

### Data Consistency
- **Strong Consistency:** Cart operations must be immediately consistent across all user sessions
- **Eventual Consistency:** Product and inventory data will converge within 1 second of Shopify updates
- **Conflict Resolution:** Last-write-wins for product data, quantity-based resolution for inventory

### Real-Time Guarantees
- **Update Propagation:** Changes propagate to all connected clients within 1 second
- **Connection Recovery:** Automatic reconnection within 5 seconds of network restoration  
- **Data Freshness:** Cached data never exceeds 5 minutes age without explicit user acceptance

### Business Rule Enforcement
- **Inventory Constraints:** Cannot add more items to cart than available inventory
- **Price Accuracy:** Displayed prices match Shopify admin within 1 second of updates
- **Product Availability:** Discontinued products are hidden within 1 second of deletion

### Security Properties  
- **Authentication:** All WebSocket connections are authenticated and authorized
- **Data Validation:** All incoming data is validated against strict schemas
- **Input Sanitization:** All user inputs are sanitized to prevent XSS and injection attacks

## Testing Strategy

### Unit Testing Approach
- **Component Testing:** Test all smart components with mocked WebSocket data
- **Hook Testing:** Test custom hooks for state management and real-time updates
- **Utility Testing:** Test data transformation and validation utilities
- **Coverage Target:** Minimum 80% code coverage for all critical paths

### Integration Testing Approach  
- **WebSocket Flow Testing:** Test complete WebSocket connection and message handling
- **Shopify API Integration:** Test webhook handling and API response processing
- **Cache Integration:** Test cache invalidation and data synchronization
- **Error Scenario Testing:** Test error handling and recovery mechanisms

### End-to-End Testing Scenarios
- **Complete Shopping Journey:** User browses products, adds to cart, and checks out
- **Real-Time Product Updates:** Admin changes product, user sees update immediately
- **Inventory Management:** Product goes out of stock, cart is updated automatically
- **Cross-Device Synchronization:** Cart changes sync across multiple browser tabs/devices
- **Network Failure Recovery:** Connection drops and recovers, data remains consistent

### Performance Testing Requirements
- **Load Testing:** System handles 1000+ concurrent WebSocket connections
- **Stress Testing:** System recovers gracefully from resource exhaustion
- **Memory Testing:** No memory leaks during extended real-time operations
- **Mobile Testing:** Performance remains acceptable on mobile devices

### Testing Environment Setup
```typescript
// Test configuration
interface TestConfig {
  mockWebSocketServer: string
  testShopifyStore: string
  testAccessToken: string
  performanceThresholds: {
    connectionTime: number
    updateLatency: number
    memoryUsage: number
  }
}
```

### Automated Testing Pipeline
- **Pre-commit:** Lint, type check, unit tests
- **PR Validation:** Integration tests, security scans  
- **Staging Deployment:** E2E tests, performance tests
- **Production Deployment:** Smoke tests, monitoring validation

This comprehensive testing strategy ensures the real-time e-commerce platform maintains high reliability, performance, and user experience while handling complex real-time data synchronization requirements.
