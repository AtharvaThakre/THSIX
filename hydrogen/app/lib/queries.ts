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

/** Home page "Latest drops" carousel (was <shopify-list-context query="products" first=250>). */
export const HOME_PRODUCTS_QUERY = `#graphql
  query HomeProducts(
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
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
    }
  }
  ${IMAGE_FIELDS}
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

/** Brand page: a Shopify collection and its products. */
export const COLLECTION_QUERY = `#graphql
  query CollectionByHandle(
    $handle: String!
    $first: Int!
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
      products(first: $first) {
        nodes {
          id
          title
          handle
          vendor
          availableForSale
          featuredImage {
            ...ImageFields
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
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

/** Product handles for sitemap.xml. */
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
  }
` as const;
