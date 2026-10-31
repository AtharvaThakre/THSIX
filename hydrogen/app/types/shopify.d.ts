/**
 * Ambient browser globals set by third-party scripts loaded in root.tsx.
 */
export {};

declare global {
  interface Window {
    // Meta Pixel (fbevents.js)
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    // Server-side (Conversions API) copy of a pixel event, defined by the pixel script in root.tsx
    thsixCapi?: (eventName: string, eventId: string, data?: Record<string, any>) => void;
  }
}
