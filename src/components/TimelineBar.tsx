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

interface TimelineBarProps {
  items: TimelineBarItem[];
  minYear?: number;
  maxYear?: number;
  className?: string;
  onHover?: (item: TimelineBarItem | null) => void;
  onSelect?: (item: TimelineBarItem | null) => void;
  selectedId?: string | null;
}

export default function TimelineBar({
  items,
  minYear: propMinYear,
  maxYear: propMaxYear,
  className = '',
  onHover,
  onSelect,
  selectedId: controlledSelectedId,
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

  // Year tick marks for the axis
  const yearTicks: number[] = [];
  for (let y = Math.ceil(range.minYear); y <= Math.floor(range.maxYear); y++) {
    yearTicks.push(y);
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
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
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((id) => (id === item.id ? null : id))}
              onClick={() => handleClick(item)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={item.title}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(item);
                }
              }}
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
                fillOpacity={isActive ? 0.25 : 0.12}
              />
              {/* Bracket border */}
              <path
                d={bracketPath(left, y1, right, y2, BRACKET_RADIUS)}
                fill="none"
                stroke={col}
                strokeOpacity={isActive ? 1 : 0.7}
                strokeWidth={isActive ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {isSelected && (
                <circle
                  cx={(left + right) / 2}
                  cy={y2}
                  r={3}
                  fill={col}
                />
              )}
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
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId((id) => (id === item.id ? null : id))}
              onClick={() => handleClick(item)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={item.title}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(item);
                }
              }}
            >
              {/* Wide hit area for easy clicking/tapping */}
              <rect
                x={0}
                y={cy - 12}
                width={width}
                height={24}
                fill="transparent"
              />
              <line
                x1={AXIS_X}
                y1={cy}
                x2={width}
                y2={cy}
                stroke={col}
                strokeOpacity={isActive ? 1 : 0.55}
                strokeWidth={isActive ? 3 : 2}
                strokeDasharray={isSelected ? 'none' : '6 4'}
                strokeLinecap="round"
              />
              {isSelected && (
                <circle cx={AXIS_X + 6} cy={cy} r={3} fill={col} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
