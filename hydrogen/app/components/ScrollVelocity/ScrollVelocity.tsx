import { useRef, useLayoutEffect, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity
} from 'motion/react';
import './ScrollVelocity.css';

// Longest frame step used for movement; a long gap (tab switch, long task) is clamped
const MAX_FRAME_MS = 40;

interface VelocityTextProps {
  children: React.ReactNode;
  baseVelocity?: number;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: { input: number[]; output: number[] };
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

const VelocityText = ({
  children,
  baseVelocity = 100,
  scrollContainerRef,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle
}: VelocityTextProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const baseX = useMotionValue(0);
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
  const { scrollY } = useScroll(scrollOptions);
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: damping ?? 50,
    stiffness: stiffness ?? 400
  });

  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping?.input || [0, 1000],
    velocityMapping?.output || [0, 5],
    { clamp: false }
  );

  // Copy width lives in a ref (not state) so resizing never re-renders the marquee
  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidthRef = useRef(0);

  useLayoutEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    // The observer fires once on observe, so this is the initial measurement too
    const observer = new ResizeObserver(() => {
      copyWidthRef.current = copy.offsetWidth;
    });
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  function wrap(min: number, max: number, v: number) {
    const range = max - min;
    const mod = (((v - min) % range) + range) % range;
    return mod + min;
  }

  const x = useTransform(baseX, v => {
    const width = copyWidthRef.current;
    if (width === 0) return '0px';
    return `${wrap(-width, 0, v)}px`;
  });

  const directionFactor = useRef(1);

  // The marquee only animates while it is on screen, the tab is visible and the
  // user has not asked for reduced motion. Otherwise no frames are requested.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId = 0;
    let lastTime: number | null = null;
    let onScreen = false;

    const tick = (time: number) => {
      const delta = lastTime === null ? 16 : Math.min(time - lastTime, MAX_FRAME_MS);
      lastTime = time;

      const factor = velocityFactor.get();
      let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
      if (factor < 0) {
        directionFactor.current = -1;
      } else if (factor > 0) {
        directionFactor.current = 1;
      }

      moveBy += directionFactor.current * moveBy * factor;
      baseX.set(baseX.get() + moveBy);
      frameId = requestAnimationFrame(tick);
    };

    const update = () => {
      const shouldRun = onScreen && document.visibilityState === 'visible';
      if (shouldRun && !frameId) {
        lastTime = null;
        frameId = requestAnimationFrame(tick);
      } else if (!shouldRun && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        update();
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', update);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      cancelAnimationFrame(frameId);
    };
  }, [baseVelocity, baseX, velocityFactor]);

  const spans = [];
  for (let i = 0; i < numCopies; i++) {
    spans.push(
      <span className={className} key={i} ref={i === 0 ? copyRef : null}>
        {children}
      </span>
    );
  }

  return (
    <div ref={rootRef} className={parallaxClassName} style={parallaxStyle}>
      <motion.div className={scrollerClassName} style={{ x, ...scrollerStyle }}>
        {spans}
      </motion.div>
    </div>
  );
};

interface ScrollVelocityProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  texts?: React.ReactNode[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: { input: number[]; output: number[] };
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
}

export const ScrollVelocity = ({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle
}: ScrollVelocityProps) => {
  return (
    <section>
      {texts.map((text, index) => (
        <VelocityText
          key={index}
          className={className}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
