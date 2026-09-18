import { useEffect, useState, useRef } from 'react';

/**
 * Hook to smoothly animate a numeric value from previous to next value
 * using requestAnimationFrame with cubic/quintic easeOut.
 */
export function useSmoothValue(targetValue: number, duration = 650): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const currentRef = useRef(targetValue);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If the target is the same, no animation needed
    if (Math.abs(targetValue - currentRef.current) < 0.01) {
      setDisplayValue(targetValue);
      currentRef.current = targetValue;
      return;
    }

    const startValue = currentRef.current;
    const endValue = targetValue;
    const startTime = performance.now();

    // Ease-out cubic function for organic and natural deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const nextVal = startValue + (endValue - startValue) * easedProgress;
      currentRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = endValue;
        setDisplayValue(endValue);
      }
    };

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}
