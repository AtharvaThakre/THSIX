# Product Image Gallery Design

## Overview
Design and implement a comprehensive product image gallery for the ProductDetailPage that displays all product images from Shopify, allowing users to view products from multiple angles with interactive thumbnail navigation.

## Current State
- ProductDetailPage only shows `product.selectedOrFirstAvailableVariant.image` (single image)
- Shopify store contains 7+ images per product from different angles
- Only one thumbnail is displayed (duplicates the main image)
- Users cannot browse through available product photos

## Design Goals
1. **Display All Product Images**: Show all uploaded product media from Shopify
2. **Interactive Thumbnails**: Clickable thumbnail grid for image navigation  
3. **Responsive Layout**: Works seamlessly across desktop, tablet, and mobile
4. **Smooth Interactions**: Elegant transitions between images
5. **Shopify Integration**: Leverage existing Shopify web components architecture

## Technical Architecture

### Data Access Strategy
**Problem**: Current implementation uses `product.selectedOrFirstAvailableVariant.image` which only returns variant-specific image
**Solution**: Access `product.media` array to get all product images

### Component Structure
```
ProductDetailPage
├── product-detail__images
    ├── product-detail__main-image (large display)
    ├── product-detail__thumbnails (scrollable grid)
    └── product-detail__image-controls (optional: arrows, indicators)
```

### Shopify Web Components Integration
**Current Pattern**:
```html
<shopify-media query="product.selectedOrFirstAvailableVariant.image" />
```

**Enhanced Pattern**:
```html
<!-- Main Image Display -->
<shopify-media query="product.media[selectedIndex]" />

<!-- Thumbnail Grid -->
<shopify-list-context type="media" query="product.media">
  <template>
    <shopify-media query="media" />
  </template>
</shopify-list-context>
```

### State Management Approach
```typescript
interface ImageGalleryState {
  selectedImageIndex: number
  totalImages: number
  thumbnailOffset: number // for scrollable thumbnails
}
```

### React + Shopify Hybrid Strategy
**Challenge**: Shopify web components render after React, making state synchronization complex

**Solution**: Hybrid approach using:
1. **React state** for UI interactions and thumbnail selection
2. **DOM manipulation** to sync with Shopify-rendered media elements
3. **Event listeners** to bridge React and Shopify component updates

## Implementation Strategy

### Phase 1: Media Query Enhancement
- Replace single image query with media collection access
- Implement fallback to variant image if media array is empty
- Ensure backward compatibility with existing single-image products

### Phase 2: Interactive Thumbnail Grid
- Create scrollable thumbnail container with responsive grid
- Implement click handlers for thumbnail selection
- Add active state styling for selected thumbnail

### Phase 3: Main Image Synchronization
- Sync main image display with selected thumbnail
- Implement smooth transitions between images
- Add loading states for image switching

### Phase 4: Mobile Optimization
- Horizontal scroll thumbnails on mobile
- Touch gestures for image navigation
- Optimize thumbnail sizes for mobile performance

## Technical Considerations

### Shopify Media Query Structure
```graphql
product {
  media(first: 10) {
    edges {
      node {
        id
        mediaContentType
        alt
        ... on MediaImage {
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
}
```

### Component Communication Pattern
1. **React manages**: UI state, thumbnail selection, responsive behavior
2. **Shopify renders**: Actual media elements, image optimization, lazy loading
3. **Bridge layer**: DOM event handlers to sync state between systems

### Performance Optimization
- **Lazy loading**: Only load visible thumbnails initially
- **Image preloading**: Preload next/previous images for smooth navigation
- **Responsive images**: Let Shopify components handle srcset/sizes optimization
- **Thumbnail optimization**: Use smaller image sizes for thumbnails

### Error Handling Strategy
```typescript
// Fallback chain
1. product.media[selectedIndex] → Selected image
2. product.selectedOrFirstAvailableVariant.image → Variant image  
3. product.featuredImage → Default product image
4. placeholder → No image available state
```

### Browser Compatibility
- **Modern browsers**: Full functionality with CSS Grid and modern APIs
- **Legacy support**: Graceful degradation to single image display
- **Mobile browsers**: Touch-optimized interactions

## UI/UX Design Patterns

### Desktop Layout
```
[Thumbnail 1] [Thumbnail 2] [Thumbnail 3] [Thumbnail 4]
[Thumbnail 5] [Thumbnail 6] [Thumbnail 7] [    +2     ]

              [MAIN IMAGE DISPLAY]
```

### Mobile Layout
```
[Th1][Th2][Th3][Th4][Th5] → (horizontal scroll)
        
        [MAIN IMAGE]
```

### Interaction Patterns
- **Click thumbnail**: Switch main image immediately
- **Keyboard navigation**: Arrow keys to navigate images
- **Touch gestures**: Swipe on mobile to change images
- **Hover states**: Preview on thumbnail hover (desktop only)

## CSS Strategy

### Grid System for Thumbnails
```css
.product-detail__thumbnails {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .product-detail__thumbnails {
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
  }
}
```

### Smooth Transitions
```css
.product-detail__main-image img {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.product-detail__thumbnail {
  transition: all 0.2s ease;
  cursor: pointer;
}

.product-detail__thumbnail--active {
  border-color: var(--black);
  transform: scale(1.05);
}
```

## Integration Points

### Existing Components to Modify
1. **ProductDetailPage.tsx**: Add image gallery state and logic
2. **ProductDetailPage.css**: Enhanced styling for image gallery
3. **Product card components**: Ensure consistency with gallery patterns

### Shopify Web Components Dependencies
- Ensure `shopify-media` supports media array queries  
- Verify `shopify-list-context` can iterate over product.media
- Test media lazy loading behavior with multiple images

### Testing Strategy
- **Manual testing**: Verify all product images display correctly
- **Responsive testing**: Test thumbnail grids across screen sizes
- **Performance testing**: Measure image loading performance with 7+ images
- **Cross-browser testing**: Ensure Shopify component compatibility

## Success Metrics
1. **Functional**: All product images from Shopify admin appear in gallery
2. **Interactive**: Users can click thumbnails to switch main image
3. **Responsive**: Gallery works smoothly on mobile and desktop
4. **Performance**: Images load efficiently without blocking UI
5. **Accessible**: Gallery supports keyboard navigation and screen readers

## Risk Mitigation

### Shopify Component Limitations
**Risk**: `product.media` query may not be supported by web components
**Mitigation**: Implement progressive enhancement with fallback to variant images

### Performance with Many Images
**Risk**: 10+ product images could slow page load
**Mitigation**: Implement lazy loading and thumbnail size optimization

### State Synchronization Issues  
**Risk**: React state and Shopify rendering may get out of sync
**Mitigation**: Use DOM observers and event delegation for reliable state management

This design provides a comprehensive approach to implementing the product image gallery while working within the existing Shopify web components architecture.
