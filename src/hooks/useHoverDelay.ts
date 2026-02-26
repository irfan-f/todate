import { useState, useRef, useCallback } from 'react';

export function useHoverDelay(delayMs: number) {
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => setIsActive(true), delayMs);
  }, [delayMs]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  }, []);

  return [isActive, { onMouseEnter, onMouseLeave }] as const;
}
