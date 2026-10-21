// Fired by the header's menu button; CartManager listens for it so the cart and the collections
// menu are never open at the same time. (The menu closes itself on OPEN_CART_EVENT.)
export const OPEN_MENU_EVENT = 'thsix:open-menu';
export const announceMenuOpen = () => window.dispatchEvent(new Event(OPEN_MENU_EVENT));

export const COLLECTION_MENU_ID = 'collection-menu';
