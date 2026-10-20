/**
 * Ambient browser globals set by third-party scripts loaded in root.tsx.
 */
export {};

declare global {
  interface Window {
    // Meta Pixel (fbevents.js)
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}
