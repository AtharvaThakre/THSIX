import {Suspense, useEffect, useRef} from 'react';
import type {RefObject} from 'react';
import {Await, Link, useLocation, useRouteLoaderData} from 'react-router';
import {X} from 'lucide-react';
import type {RootLoader} from '~/root';
import {onSmoothScroll} from '../../hooks/smoothScroll';
import {OPEN_CART_EVENT} from '../Cart/openCart';
import {COLLECTION_MENU_ID} from './menuEvents';
import './CollectionMenu.css';

export interface MenuNavLink {
  href: string;
  label: string;
  /** Home-page section id, when the link scrolls within the home page */
  sectionId?: string;
}

interface CollectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** The header's menu button: focus returns here when the drawer closes */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Site navigation shown on mobile, where the header's center nav is hidden */
  navLinks: MenuNavLink[];
  onNavLinkClick: (event: React.MouseEvent<HTMLAnchorElement>, link: MenuNavLink) => void;
}

type MenuCollection = {id: string; handle: string; title: string};

const TITLE_ID = `${COLLECTION_MENU_ID}-title`;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SKELETON_ROWS = [72, 54, 64, 48, 58];

function MenuSkeleton() {
  return (
    <div className="collection-menu__skeleton" role="status" aria-live="polite">
      <span className="collection-menu__sr-only">Loading collections</span>
      {SKELETON_ROWS.map((width) => (
        <span
          key={width}
          className="collection-menu__skeleton-row"
          style={{width: `${width}%`}}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function MenuError() {
  return (
    <div className="collection-menu__message" role="alert">
      <p>Couldn&apos;t load collections.</p>
      <button
        type="button"
        className="collection-menu__retry"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}

function CollectionList({
  collections,
  pathname,
  onClose,
}: {
  collections: MenuCollection[] | null | undefined;
  pathname: string;
  onClose: () => void;
}) {
  if (!collections) return <MenuError />;
  if (collections.length === 0) {
    return (
      <div className="collection-menu__message">
        <p>No collections yet.</p>
      </div>
    );
  }
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return (
    <ul className="collection-menu__list">
      {collections.map((collection) => {
        const to = `/collections/${collection.handle}`;
        const isActive = current === to;
        return (
          <li key={collection.id}>
            <Link
              to={to}
              prefetch="intent"
              className={`collection-menu__link${isActive ? ' collection-menu__link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={onClose}
            >
              {collection.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export const CollectionMenu = ({
  isOpen,
  onClose,
  triggerRef,
  navLinks,
  onNavLinkClick,
}: CollectionMenuProps) => {
  const {pathname} = useLocation();
  // Streamed by the root loader (unawaited promise): in the SSR HTML, never fetched on the client
  const collections = useRouteLoaderData<RootLoader>('root')?.menuCollections;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const returnFocusRef = useRef(true);

  // Close on route change
  const pathRef = useRef(pathname);
  useEffect(() => {
    if (pathRef.current !== pathname) {
      pathRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Opening the cart closes the menu (the cart takes over, so don't pull focus back)
  useEffect(() => {
    const closeForCart = () => {
      returnFocusRef.current = false;
      onClose();
    };
    window.addEventListener(OPEN_CART_EVENT, closeForCart);
    return () => window.removeEventListener(OPEN_CART_EVENT, closeForCart);
  }, [onClose]);

  // Esc closes; Tab / Shift+Tab stay inside the drawer
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Scroll lock: same overflow approach as the cart, plus pausing Lenis (which otherwise
  // keeps handling wheel/touch input and scrolls the page behind the drawer)
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const stopped: Array<{start: () => void}> = [];
    const unsubscribe = onSmoothScroll((lenis) => {
      lenis.stop();
      stopped.push(lenis);
    });
    return () => {
      unsubscribe();
      document.body.style.overflow = '';
      for (const lenis of stopped) {
        try {
          lenis.start();
        } catch {
          /* instance already destroyed */
        }
      }
    };
  }, [isOpen]);

  // Focus: into the drawer on open, back to the menu button on close
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      returnFocusRef.current = true;
      closeBtnRef.current?.focus({preventScroll: true});
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const active = document.activeElement;
      // Focus is still inside the drawer here (the browser moves it off the now-`inert` drawer
      // only at its next focus fixup), or already on <body>; in both cases hand it back
      const focusLost = !active || active === document.body || panelRef.current?.contains(active);
      if (returnFocusRef.current && focusLost) {
        triggerRef.current?.focus({preventScroll: true});
      }
    }
  }, [isOpen, triggerRef]);

  return (
    // Always in the DOM so the collection links are in the SSR HTML (crawlable); `inert` keeps
    // them out of the tab order and the accessibility tree while closed
    <div
      className={`collection-menu${isOpen ? ' collection-menu--open' : ''}`}
      inert={!isOpen}
    >
      <div className="collection-menu__overlay" aria-hidden="true" onClick={onClose} />
      <div
        id={COLLECTION_MENU_ID}
        ref={panelRef}
        className="collection-menu__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        data-lenis-prevent
      >
        <div className="collection-menu__header">
          <h2 id={TITLE_ID} className="collection-menu__title">
            Menu
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="collection-menu__close"
            onClick={onClose}
            aria-label="Close collections menu"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="collection-menu__body">
          <nav aria-label="Collections">
            <Suspense fallback={<MenuSkeleton />}>
              <Await resolve={collections ?? null} errorElement={<MenuError />}>
                {(resolved) => (
                  <CollectionList collections={resolved} pathname={pathname} onClose={onClose} />
                )}
              </Await>
            </Suspense>
          </nav>

          <nav className="collection-menu__secondary" aria-label="Site">
            <ul className="collection-menu__secondary-list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="collection-menu__secondary-link"
                    onClick={(e) => onNavLinkClick(e, link)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};
