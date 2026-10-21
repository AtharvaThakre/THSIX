import { Suspense, use, useEffect, useRef, useState, type ReactNode } from 'react';

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
  /** How far outside the viewport the section starts loading. */
  rootMargin?: string;
}

/**
 * Defers the JavaScript for a below-the-fold section until it is about to
 * enter the viewport. The markup and its CSS are still server-rendered (HomePage imports the
 * section stylesheets), so the section keeps its real size and nothing shifts.
 */
export function LazySection({ children, rootMargin = '600px 0px' }: LazySectionProps) {
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
    <div ref={wrapperRef}>
      <Suspense fallback={null}>
        <Gated gate={gate}>{children}</Gated>
      </Suspense>
    </div>
  );
}
