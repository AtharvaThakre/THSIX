/**
 * Storefront API queries run by route loaders (server-side, cached by Hydrogen).
 * Types are generated into storefrontapi.generated.d.ts by `npm run codegen`.
 */

const IMAGE_FIELDS = `#graphql
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

/** Fields every product card needs (home carousels, collection pages). */
const PRODUCT_CARD_FIELDS = `#graphql
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    selectedOrFirstAvailableVariant {
      id
      image {
        ...ImageFields
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;

/**
 * Home page: the "Latest drops" carousel (all products) plus one carousel per collection.
 * One request; collections without products are dropped by the loader.
 */
export const HOME_PRODUCTS_QUERY = `#graphql
  query HomeProducts(
    $first: Int!
    $collections: Int!
    $perCollection: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
        ...ProductCard
      }
    }
    collections(first: $collections, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        products(first: $perCollection) {
          nodes {
            ...ProductCard
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FIELDS}
  ${IMAGE_FIELDS}
` as const;

/** Every published collection, for the collection menu (root loader). */
export const MENU_COLLECTIONS_QUERY = `#graphql
  query MenuCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 250, sortKey: TITLE) {
      nodes {
        id
        handle
        title
      }
    }
  }
` as const;

/** Product detail page. Edge/node shape kept so the page component is unchanged. */
export const PRODUCT_QUERY = `#graphql
  query ProductByHandle(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      descriptionHtml
      availableForSale
      seo {
        title
        description
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            ...ImageFields
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            sku
            availableForSale
            price {
              amount
              currencyCode
            }
            image {
              ...ImageFields
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
  ${IMAGE_FIELDS}
` as const;

/**
 * Collection page: a Shopify collection and one page of its products. Cursor variables come from
 * Hydrogen's getPaginationVariables() so <Pagination> can load more.
 */
export const COLLECTION_QUERY = `#graphql
  query CollectionByHandle(
    $handle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      seo {
        title
        description
      }
      image {
        ...ImageFields
      }
      products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${PRODUCT_CARD_FIELDS}
  ${IMAGE_FIELDS}
` as const;

/** Store policies from Shopify admin (Settings > Policies), used when no static copy exists. */
export const POLICIES_QUERY = `#graphql
  query ShopPolicies($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      shippingPolicy {
        title
        body
      }
      refundPolicy {
        title
        body
      }
      termsOfService {
        title
        body
      }
      privacyPolicy {
        title
        body
      }
    }
  }
` as const;

/** Product and collection handles for sitemap.xml. */
export const SITEMAP_PRODUCTS_QUERY = `#graphql
  query SitemapProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 250) {
      nodes {
        handle
        updatedAt
        onlineStoreUrl
      }
    }
    collections(first: 250) {
      nodes {
        handle
        updatedAt
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;
