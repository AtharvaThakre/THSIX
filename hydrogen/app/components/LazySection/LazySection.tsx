import { Suspense, use, useEffect, useRef, useState, type ReactNode } from 'react';
import './LazySection.css';

interface Gate {
  promise: Promise<void>;
  open: () => void;
}

function createGate(): Gate {
  let open: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

/**
 * Suspends the subtree until the gate opens. On the client this keeps the
 * server-rendered HTML in place (React leaves a suspended hydration boundary
 * dehydrated), so the section stays visible and crawlable while its JS and
 * the dynamic import of its component are deferred.
 */
function Gated({ gate, children }: { gate: Gate; children: ReactNode }) {
  if (typeof window !== 'undefined') {
    use(gate.promise);
  }
  return <>{children}</>;
}

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /** Optional anchor id; kept on the wrapper so hash links still find the section. */
  id?: string;
  /** How far outside the viewport the section starts loading. */
  rootMargin?: string;
}

/**
 * Defers the JavaScript for a below-the-fold section until it is about to
 * enter the viewport. The markup is still server-rendered, and the wrapper
 * reserves the section's height (see LazySection.css) so nothing shifts.
 */
export function LazySection({ children, className = '', id, rootMargin = '600px 0px' }: LazySectionProps) {
  const [gate] = useState(createGate);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      gate.open();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          gate.open();
        }
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [gate, rootMargin]);

  return (
    <div ref={wrapperRef} id={id} className={`lazy-section ${className}`.trim()}>
      <Suspense fallback={null}>
        <Gated gate={gate}>{children}</Gated>
      </Suspense>
    </div>
  );
}
