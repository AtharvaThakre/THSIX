// Fired by any "open cart" button (Header, ShopPage); CartManager listens for it
export const OPEN_CART_EVENT = 'thsix:open-cart';
export const openCart = () => window.dispatchEvent(new Event(OPEN_CART_EVENT));
