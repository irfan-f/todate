import { useRef, useState, useCallback } from 'react';

type ThumbId = 'start' | 'end';

interface DualRangeYearProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  ariaLabelStart: string;
  ariaLabelEnd: string;
}

export default function DualRangeYear({
  min,
  max,
  low,
  high,
  onLowChange,
  onHighChange,
  ariaLabelStart,
  ariaLabelEnd,
}: DualRangeYearProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<ThumbId | null>(null);
  const [, setActiveThumb] = useState<ThumbId | null>(null);

  const range = max - min;
  const lowPct = range === 0 ? 0 : (low - min) / range;
  const highPct = range === 0 ? 1 : (high - min) / range;

  const clientXToValue = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return low;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const value = min + pct * range;
      return Math.round(value);
    },
    [min, range, low]
  );

  const handlePointerDown = useCallback(
    (thumb: ThumbId) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      activeThumbRef.current = thumb;
      setActiveThumb(thumb);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const thumb = activeThumbRef.current;
      if (thumb === null) return;
      const value = clientXToValue(e.clientX);
      if (thumb === 'start') {
        const clamped = Math.min(high, Math.max(min, value));
        onLowChange(clamped);
      } else {
        const clamped = Math.max(low, Math.min(max, value));
        onHighChange(clamped);
      }
    },
    [clientXToValue, min, max, low, high, onLowChange, onHighChange]
  );

  const handlePointerUp = useCallback(() => {
    activeThumbRef.current = null;
    setActiveThumb(null);
  }, []);

  const moveNearestThumbTo = useCallback(
    (clientX: number) => {
      if (range === 0) return;
      const value = clientXToValue(clientX);
      const mid = (low + high) / 2;
      if (value <= mid) {
        const clamped = Math.min(high, Math.max(min, value));
        onLowChange(clamped);
      } else {
        const clamped = Math.max(low, Math.min(max, value));
        onHighChange(clamped);
      }
    },
    [clientXToValue, low, high, min, max, range, onLowChange, onHighChange]
  );

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-thumb]')) return;
      e.preventDefault();
      moveNearestThumbTo(e.clientX);
    },
    [moveNearestThumbTo]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm w-8 shrink-0 tabular-nums select-none">
        {min}
      </span>
      <div
        ref={trackRef}
        className="flex-1 relative flex items-center min-h-[44px] sm:min-h-[32px] touch-none"
        role="group"
        aria-label={`Year range ${low} to ${high}`}
      >
        {/* Track background */}
        <div
          className="absolute left-0 right-0 h-2 sm:h-2 rounded-full bg-gray-600 dark:bg-gray-500 cursor-pointer touch-none"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          onPointerDown={handleTrackPointerDown}
          aria-hidden
        />
        {/* Highlight between thumbs */}
        <div
          className="absolute h-2 rounded-full bg-gray-400 dark:bg-gray-400 pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            left: `${lowPct * 100}%`,
            width: `${(highPct - lowPct) * 100}%`,
          }}
          aria-hidden
        />
        {/* Start thumb: hit target and visual */}
        <div
          data-thumb="start"
          role="slider"
          aria-label={ariaLabelStart}
          aria-valuemin={min}
          aria-valuemax={high}
          aria-valuenow={low}
          tabIndex={0}
          onPointerDown={handlePointerDown('start')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute z-10 flex items-center justify-center cursor-grab active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-400 rounded-full min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${lowPct * 100}%`, top: '50%' }}
        >
          <span
            className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-300 dark:bg-gray-400 border-2 border-gray-500 dark:border-gray-600 shadow pointer-events-none"
            aria-hidden
          />
        </div>
        {/* End thumb */}
        <div
          data-thumb="end"
          role="slider"
          aria-label={ariaLabelEnd}
          aria-valuemin={low}
          aria-valuemax={max}
          aria-valuenow={high}
          tabIndex={0}
          onPointerDown={handlePointerDown('end')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute z-20 flex items-center justify-center cursor-grab active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-400 rounded-full min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${highPct * 100}%`, top: '50%' }}
        >
          <span
            className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-300 dark:bg-gray-400 border-2 border-gray-500 dark:border-gray-600 shadow pointer-events-none"
            aria-hidden
          />
        </div>
      </div>
      <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm w-8 shrink-0 tabular-nums select-none">
        {max}
      </span>
    </div>
  );
}
