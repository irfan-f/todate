import { useMemo, useState, useRef, useEffect, useCallback } from 'react';

export interface TimelineBarItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  comment?: string;
  /** Hex colour used for the bracket / line. Falls back to a neutral gray. */
  color?: string;
}

function dateToFractionalYear(iso: string): number {
  const d = new Date(iso);
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  return y + (d.getTime() - start) / (end - start);
}

/**
 * Greedy lane assignment: sort by start, put each item in the lowest lane
 * whose previous occupant has already ended. Non-overlapping items all
 * land in lane 0 (adjacent to the axis).
 */
function assignLanes(
  items: Array<{ start: number; end: number; id: string }>
): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const laneOf: Map<string, number> = new Map();
  const laneEnd: number[] = [];

  for (const item of sorted) {
    let lane = 0;
    while (lane < laneEnd.length && laneEnd[lane] > item.start) {
      lane++;
    }
    if (lane === laneEnd.length) {
      laneEnd.push(item.end);
    } else {
      laneEnd[lane] = item.end;
    }
    laneOf.set(item.id, lane);
  }
  return laneOf;
}

const FALLBACK_COLOR = '#6b7280'; // gray-500
const PADDING_Y = 18;
const AXIS_X = 28;
const MIN_LANE_WIDTH = 18;
const BRACKET_RADIUS = 4;
const MAX_SPAN = 200;
const LABEL_MIN_PX = 14; // minimum pixel gap between year labels before we thin them out

interface TimelineBarProps {
  items: TimelineBarItem[];
  minYear?: number;
  maxYear?: number;
  className?: string;
  onHover?: (item: TimelineBarItem | null) => void;
  onSelect?: (item: TimelineBarItem | null) => void;
  selectedId?: string | null;
  onSpanChange?: (startYear: number, endYear: number) => void;
}

export default function TimelineBar({
  items,
  minYear: propMinYear,
  maxYear: propMaxYear,
  className = '',
  onHover,
  onSelect,
  selectedId: controlledSelectedId,
  onSpanChange,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setWidth(Math.max(60, rect.width));
        setHeight(Math.max(60, rect.height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- data ---
  const { withEnd, noEnd } = useMemo(() => {
    const withEnd: TimelineBarItem[] = [];
    const noEnd: TimelineBarItem[] = [];
    items.forEach((item) => {
      if (item.endDate) withEnd.push(item);
      else noEnd.push(item);
    });
    return { withEnd, noEnd };
  }, [items]);

  const range = useMemo(() => {
    let min = propMinYear ?? new Date().getFullYear();
    let max = propMaxYear ?? new Date().getFullYear();
    if (items.length > 0) {
      const years = items.flatMap((i) => {
        const s = dateToFractionalYear(i.startDate);
        const e = i.endDate ? dateToFractionalYear(i.endDate) : s;
        return [s, e];
      });
      if (!propMinYear) min = Math.floor(Math.min(...years));
      if (!propMaxYear) max = Math.ceil(Math.max(...years));
    }
    if (min === max) max = min + 1;
    return { minYear: min, maxYear: max };
  }, [items, propMinYear, propMaxYear]);

  const laneMap = useMemo(() => {
    return assignLanes(
      withEnd.map((item) => ({
        id: item.id,
        start: dateToFractionalYear(item.startDate),
        end: dateToFractionalYear(item.endDate!),
      }))
    );
  }, [withEnd]);

  const laneCount = withEnd.length === 0 ? 0 : Math.max(...Array.from(laneMap.values())) + 1;

  // Y maps fractional year → pixel (top = minYear, bottom = maxYear)
  const yPos = (year: number) =>
    PADDING_Y + ((year - range.minYear) / (range.maxYear - range.minYear)) * (height - 2 * PADDING_Y);

  // X: lanes start after the axis — only bracket items need lanes (no-end items don't)
  const lanesStartX = AXIS_X + 4;
  const availableW = width - lanesStartX - 4;
  const laneW = laneCount > 0
    ? Math.max(MIN_LANE_WIDTH, availableW / laneCount)
    : MIN_LANE_WIDTH;
  const pad = 2;

  // --- Hover + click-to-select ---
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const activeId = hoveredId ?? selectedId;

  useEffect(() => {
    if (onHover) {
      const item = items.find((i) => i.id === activeId) ?? null;
      onHover(item);
    }
  }, [activeId, items, onHover]);

  const handleClick = useCallback(
    (item: TimelineBarItem) => {
      const next = selectedId === item.id ? null : item.id;
      if (controlledSelectedId === undefined) setInternalSelectedId(next);
      if (onSelect) onSelect(next ? item : null);
    },
    [selectedId, controlledSelectedId, onSelect]
  );

  /**
   * Vertical "]" bracket: top horizontal, right vertical, bottom horizontal.
   * Open on the left. Rounded top-right and bottom-right corners.
   */
  function bracketPath(
    left: number, top: number, right: number, bottom: number, r: number
  ): string {
    const w = right - left;
    const h = bottom - top;
    const cr = Math.min(r, w / 2, h / 2);
    return [
      `M ${left} ${top}`,
      `L ${right - cr} ${top}`,
      `Q ${right} ${top} ${right} ${top + cr}`,
      `L ${right} ${bottom - cr}`,
      `Q ${right} ${bottom} ${right - cr} ${bottom}`,
      `L ${left} ${bottom}`,
    ].join(' ');
  }

  // Year tick marks — thin out labels when they'd overlap
  const totalYears = range.maxYear - range.minYear;
  const pxPerYear = totalYears > 0 ? (height - 2 * PADDING_Y) / totalYears : 1;
  const STEP_OPTIONS = [1, 2, 5, 10, 20, 25, 50, 100];
  const yearStep = STEP_OPTIONS.find((s) => s * pxPerYear >= LABEL_MIN_PX) ?? 100;

  const yearTicks: number[] = [];
  const firstTick = Math.ceil(range.minYear / yearStep) * yearStep;
  for (let y = firstTick; y <= Math.floor(range.maxYear); y += yearStep) {
    yearTicks.push(y);
  }

  // --- Visual-order sorted items for arrow key navigation ---
  const sortedItems = useMemo(() => {
    const allItems = items.map((item) => ({
      item,
      y: yPos(dateToFractionalYear(item.startDate)),
    }));
    allItems.sort((a, b) => a.y - b.y);
    return allItems.map((a) => a.item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, range.minYear, range.maxYear, height]);

  // Arrow key navigation within the timeline
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (sortedItems.length === 0) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Escape') return;
      e.preventDefault();

      if (e.key === 'Escape') {
        if (controlledSelectedId === undefined) setInternalSelectedId(null);
        if (onSelect) onSelect(null);
        return;
      }

      const currentIdx = activeId ? sortedItems.findIndex((i) => i.id === activeId) : -1;
      let nextIdx: number;
      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < sortedItems.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : sortedItems.length - 1;
      }
      const nextItem = sortedItems[nextIdx];
      if (controlledSelectedId === undefined) setInternalSelectedId(nextItem.id);
      if (onSelect) onSelect(nextItem);
    },
    [sortedItems, activeId, controlledSelectedId, onSelect]
  );

  // --- Pinch / Ctrl+scroll gesture for timeline span ---
  // Accumulate fractional changes so small spans still respond to gestures
  const fracMinRef = useRef(propMinYear ?? range.minYear);
  const fracMaxRef = useRef(propMaxYear ?? range.maxYear);
  useEffect(() => {
    fracMinRef.current = propMinYear ?? range.minYear;
    fracMaxRef.current = propMaxYear ?? range.maxYear;
  }, [propMinYear, propMaxYear, range.minYear, range.maxYear]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onSpanChange) return;

    const clampSpan = () => {
      const span = fracMaxRef.current - fracMinRef.current;
      if (span > MAX_SPAN) {
        const center = (fracMinRef.current + fracMaxRef.current) / 2;
        fracMinRef.current = center - MAX_SPAN / 2;
        fracMaxRef.current = center + MAX_SPAN / 2;
      }
    };

    const applySpan = () => {
      clampSpan();
      const rMin = Math.round(fracMinRef.current);
      const rMax = Math.round(fracMaxRef.current);
      if (rMax - rMin < 1) return;
      onSpanChange(rMin, rMax);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const span = fracMaxRef.current - fracMinRef.current;
      const delta = e.deltaY > 0 ? 0.08 : -0.08;
      const change = span * delta;
      fracMinRef.current -= change;
      fracMaxRef.current += change;
      applySpan();
    };

    let lastPinchDist = 0;
    const activeTouches = new Map<number, Touch>();

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.set(e.changedTouches[i].identifier, e.changedTouches[i]);
      }
      if (activeTouches.size === 2) {
        const pts = Array.from(activeTouches.values());
        lastPinchDist = Math.hypot(
          pts[1].clientX - pts[0].clientX,
          pts[1].clientY - pts[0].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.set(e.changedTouches[i].identifier, e.changedTouches[i]);
      }
      if (activeTouches.size !== 2) return;
      e.preventDefault();

      const pts = Array.from(activeTouches.values());
      const dist = Math.hypot(
        pts[1].clientX - pts[0].clientX,
        pts[1].clientY - pts[0].clientY
      );
      if (lastPinchDist === 0) {
        lastPinchDist = dist;
        return;
      }

      const ratio = dist / lastPinchDist;
      const span = fracMaxRef.current - fracMinRef.current;
      const newSpan = Math.max(1, span / ratio);
      const center = (fracMinRef.current + fracMaxRef.current) / 2;
      fracMinRef.current = center - newSpan / 2;
      fracMaxRef.current = center + newSpan / 2;
      lastPinchDist = dist;
      applySpan();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.delete(e.changedTouches[i].identifier);
      }
      if (activeTouches.size < 2) lastPinchDist = 0;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onSpanChange]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      tabIndex={0}
      role="listbox"
      aria-label="Timeline items"
      aria-activedescendant={activeId ? `tl-item-${activeId}` : undefined}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
    >
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        aria-label="Timeline"
      >
        {/* Vertical axis line */}
        <line
          x1={AXIS_X}
          y1={PADDING_Y}
          x2={AXIS_X}
          y2={height - PADDING_Y}
          className="stroke-gray-400 dark:stroke-gray-500"
          strokeWidth={2}
        />

        {/* Year tick marks & labels */}
        {yearTicks.map((yr) => {
          const py = yPos(yr);
          return (
            <g key={yr}>
              <line
                x1={AXIS_X - 4}
                y1={py}
                x2={AXIS_X}
                y2={py}
                className="stroke-gray-400 dark:stroke-gray-500"
                strokeWidth={1}
              />
              <text
                x={AXIS_X - 6}
                y={py + 3}
                textAnchor="end"
                className="fill-gray-600 dark:fill-gray-400 font-mono"
                style={{ fontSize: 9 }}
              >
                {yr}
              </text>
            </g>
          );
        })}

        {/* Bracket range items */}
        {withEnd.map((item) => {
          const startFrac = dateToFractionalYear(item.startDate);
          const endFrac = dateToFractionalYear(item.endDate!);
          const lane = laneMap.get(item.id) ?? 0;
          const left = lanesStartX + lane * laneW + pad;
          const right = left + laneW - pad * 2;
          const y1 = yPos(startFrac);
          const y2 = yPos(endFrac);
          const col = item.color ?? FALLBACK_COLOR;
          const isActive = activeId === item.id;
          const isSelected = selectedId === item.id;
          return (
            <g
              key={item.id}
              id={`tl-item-${item.id}`}
              role="option"
              aria-selected={isSelected}
              aria-label={item.title}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((id) => (id === item.id ? null : id))}
              onClick={() => handleClick(item)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <rect
                x={left - 4}
                y={y1 - 2}
                width={right - left + 8}
                height={Math.max(y2 - y1 + 4, 16)}
                fill="transparent"
              />
              {/* Filled bracket body */}
              <path
                d={bracketPath(left, y1, right, y2, BRACKET_RADIUS)}
                fill={col}
                fillOpacity={isSelected ? 0.45 : isActive ? 0.25 : 0.12}
              />
              {/* Bracket border */}
              <path
                d={bracketPath(left, y1, right, y2, BRACKET_RADIUS)}
                fill="none"
                stroke={col}
                strokeOpacity={isActive ? 1 : 0.7}
                strokeWidth={isSelected ? 2.5 : isActive ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* No-end items: dashed lines — rendered last so they sit above brackets */}
        {noEnd.map((item) => {
          const startFrac = dateToFractionalYear(item.startDate);
          const cy = yPos(startFrac);
          const col = item.color ?? FALLBACK_COLOR;
          const isActive = activeId === item.id;
          const isSelected = selectedId === item.id;
          return (
            <g
              key={item.id}
              id={`tl-item-${item.id}`}
              role="option"
              aria-selected={isSelected}
              aria-label={item.title}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((id) => (id === item.id ? null : id))}
              onClick={() => handleClick(item)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area — half-size for less obstruction at small scales */}
              <rect
                x={AXIS_X}
                y={cy - 6}
                width={width - AXIS_X}
                height={12}
                fill="transparent"
              />
              <line
                x1={AXIS_X}
                y1={cy}
                x2={width}
                y2={cy}
                stroke={col}
                strokeOpacity={isSelected ? 1 : isActive ? 1 : 0.55}
                strokeWidth={isSelected ? 3 : isActive ? 3 : 2}
                strokeDasharray={isSelected ? 'none' : '6 4'}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
