import {Link} from 'react-router';
import {Pagination} from '@shopify/hydrogen';
import type {CollectionByHandleQuery, ProductCardFragment} from 'storefrontapi.generated';
import {AnnouncementBar} from '../components/Header/AnnouncementBar';
import {Header} from '../components/Header/Header';
import {Footer} from '../components/Footer/Footer';
import {ProductCard} from '../components/ProductCard/ProductCard';
import './CollectionPage.css';

// Grid columns: 2 (<=767px, 16px gutters, 12px gap), 3 (<=1023px), then 4 in a 1360px container
const GRID_SIZES =
  '(max-width: 767px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 80px) / 3), (max-width: 1400px) calc((100vw - 120px) / 4), 310px';
// The first row on desktop is visible on load; later cards load lazily
const EAGER_CARDS = 4;

type CollectionData = NonNullable<CollectionByHandleQuery['collection']>;

interface CollectionPageProps {
  state: 'ok' | 'not-found' | 'error';
  collection: CollectionData | null;
}

/** Collection page for any Shopify collection. Data is loaded by routes/collections.$handle.tsx. */
export function CollectionPage({state, collection}: CollectionPageProps) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="collection-page">
        {state === 'ok' && collection ? (
          <CollectionContent collection={collection} />
        ) : state === 'error' ? (
          <div className="collection-status" role="alert">
            <h1 className="collection-status__title">Something went wrong</h1>
            <p className="collection-status__text">We couldn&apos;t load this collection right now.</p>
            <button type="button" className="collection-status__button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : (
          <div className="collection-status">
            <h1 className="collection-status__title">Collection not found</h1>
            <p className="collection-status__text">
              This collection doesn&apos;t exist or is no longer available.
            </p>
            <Link className="collection-status__button" to="/#shop">
              Shop all
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function CollectionContent({collection}: {collection: CollectionData}) {
  const description = collection.description.trim();

  return (
    <div className="collection-page__inner">
      <header className="collection-page__header">
        <p className="collection-page__eyebrow">Collection</p>
        <h1 className="collection-page__title">{collection.title}</h1>
        {description ? <p className="collection-page__description">{description}</p> : null}
      </header>

      {collection.products.nodes.length === 0 ? (
        <div className="collection-status collection-status--empty">
          <p className="collection-status__text">No products in {collection.title} yet.</p>
          <Link className="collection-status__button" to="/#shop">
            Back to shop
          </Link>
        </div>
      ) : (
        <Pagination<ProductCardFragment> connection={collection.products}>
          {({nodes, isLoading, hasNextPage, hasPreviousPage, NextLink, PreviousLink}) => (
            <>
              {hasPreviousPage ? (
                <div className="collection-page__more">
                  <PreviousLink className="collection-page__more-link" preventScrollReset>
                    {isLoading ? 'Loading…' : 'Load previous'}
                  </PreviousLink>
                </div>
              ) : null}

              <ul className="collection-grid">
                {nodes.map((product, index) => (
                  <li key={product.id} className="collection-grid__item">
                    <ProductCard
                      product={product}
                      sizes={GRID_SIZES}
                      loading={index < EAGER_CARDS ? 'eager' : 'lazy'}
                    />
                  </li>
                ))}
              </ul>

              {hasNextPage ? (
                <div className="collection-page__more">
                  <NextLink className="collection-page__more-link" preventScrollReset>
                    {isLoading ? 'Loading…' : 'Load more'}
                  </NextLink>
                </div>
              ) : null}
            </>
          )}
        </Pagination>
      )}
    </div>
  );
}
