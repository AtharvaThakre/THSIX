import type Lenis from 'lenis';

type LenisListener = (lenis: Lenis) => void;

let activeLenis: Lenis | null = null;
const listeners = new Set<LenisListener>();

/** Called by the page that owns the smooth-scroll instance (null on teardown). */
export function setSmoothScroll(lenis: Lenis | null) {
  activeLenis = lenis;
  if (lenis) listeners.forEach((listener) => listener(lenis));
}

/**
 * Runs `listener` now if Lenis is running, and again whenever it starts.
 * Returns an unsubscribe function.
 */
export function onSmoothScroll(listener: LenisListener): () => void {
  listeners.add(listener);
  if (activeLenis) listener(activeLenis);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Keeps a GSAP ScrollTrigger in step with Lenis smooth scrolling. Only call
 * this from code that has already loaded ScrollTrigger. Returns a cleanup.
 */
export function syncScrollTrigger(ScrollTrigger: { update: () => void }): () => void {
  let unsubscribeScroll: (() => void) | undefined;
  const unsubscribe = onSmoothScroll((lenis) => {
    unsubscribeScroll?.();
    unsubscribeScroll = lenis.on('scroll', () => ScrollTrigger.update());
  });
  return () => {
    unsubscribe();
    unsubscribeScroll?.();
  };
}
