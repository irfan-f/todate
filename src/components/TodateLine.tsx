import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { TodateType, SchoolStartDate } from '../types';
import { dateValueToIso } from '../utils/date';
import TimelineBar, { type TimelineBarItem } from './TimelineBar';
import Todate from './Todate';
import Icon from './Icon';
import rightPanelCloseIcon from '../assets/right-panel-close.svg?raw';
import rightPanelOpenIcon from '../assets/right-panel-open.svg?raw';

const FALLBACK_TAG_COLOR = '#9ca3af'; // gray-400

const TIMELINE_WIDTH_STORAGE_KEY = 'todate-timeline-width-pct';
const MIN_TIMELINE_PCT = 15;
const MAX_TIMELINE_PCT = 100;
const DEFAULT_TIMELINE_PCT = 25;

/**
 * Convert a TodateType into a TimelineBarItem for the vertical timeline.
 * Uses `date` (always set) for startDate. For endDate, converts `endDateDisplay`
 * through dateValueToIso when present.
 */
function todateToBarItem(
  todate: TodateType,
  schoolStartDate: SchoolStartDate | null
): TimelineBarItem {
  let endDate: string | undefined;
  if (todate.endDateDisplay) {
    endDate = dateValueToIso(todate.endDateDisplay, schoolStartDate);
  }
  return {
    id: todate._id,
    title: todate.title,
    startDate: todate.date,
    endDate,
    comment: todate.comment,
    color: todate.tags[0]?.color ?? FALLBACK_TAG_COLOR,
  };
}

const TodateLine = ({
  list,
  schoolStartDate,
  totalCount = 0,
  onEditTodate,
  minYear,
  maxYear,
  defaultContent,
  onActiveChange,
  onSpanChange,
}: {
  list: TodateType[];
  schoolStartDate: SchoolStartDate | null;
  totalCount?: number;
  onEditTodate?: (todate: TodateType) => void;
  minYear?: number;
  maxYear?: number;
  defaultContent?: React.ReactNode;
  onActiveChange?: (hasActive: boolean) => void;
  onSpanChange?: (startYear: number, endYear: number) => void;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineWidthPct, setTimelineWidthPct] = useState(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_TIMELINE_PCT;
    const stored = localStorage.getItem(TIMELINE_WIDTH_STORAGE_KEY);
    if (stored == null) return DEFAULT_TIMELINE_PCT;
    const n = Number(stored);
    return Number.isFinite(n) && n >= MIN_TIMELINE_PCT && n <= MAX_TIMELINE_PCT
      ? n
      : DEFAULT_TIMELINE_PCT;
  });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const effectiveWidthPct = isRightPanelCollapsed ? 100 : timelineWidthPct;
  const timelineWidthStyle = { ['--timeline-width' as string]: `${effectiveWidthPct}%` };
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, widthPct: 0 });
  const lastWidthPctRef = useRef(timelineWidthPct);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const widthToUse = isRightPanelCollapsed ? 100 : timelineWidthPct;
    dragStartRef.current = { x: e.clientX, widthPct: widthToUse };
    lastWidthPctRef.current = widthToUse;
    if (isRightPanelCollapsed) setIsRightPanelCollapsed(false);
    setIsDragging(true);
  }, [timelineWidthPct, isRightPanelCollapsed]);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const deltaPx = e.clientX - dragStartRef.current.x;
      const deltaPct = (deltaPx / rect.width) * 100;
      const next = Math.min(MAX_TIMELINE_PCT, Math.max(MIN_TIMELINE_PCT, dragStartRef.current.widthPct + deltaPct));
      lastWidthPctRef.current = next;
      setTimelineWidthPct(next);
    };
    const onUp = () => {
      setIsDragging(false);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TIMELINE_WIDTH_STORAGE_KEY, String(lastWidthPctRef.current));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) return;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isDragging]);

  const barItems = useMemo(
    () => list.map((t) => todateToBarItem(t, schoolStartDate)),
    [list, schoolStartDate]
  );

  const todateMap = useMemo(() => {
    const m = new Map<string, TodateType>();
    list.forEach((t) => m.set(t._id, t));
    return m;
  }, [list]);

  const activeId = hoveredId ?? selectedId;
  const activeTodate = activeId ? todateMap.get(activeId) ?? null : null;

  useEffect(() => {
    onActiveChange?.(activeTodate != null);
  }, [activeTodate != null, onActiveChange]);

  const handleHover = (item: TimelineBarItem | null) => {
    setHoveredId(item?.id ?? null);
  };

  const handleSelect = (item: TimelineBarItem | null) => {
    setSelectedId(item?.id ?? null);
  };

  const isEmpty = list.length === 0;
  const emptyMessage =
    totalCount === 0
      ? 'No todates yet. Create one to get started.'
      : 'No todates match the current filters.';

  const rightContent = activeTodate ? (
    <Todate
      data={activeTodate}
      schoolStartDate={schoolStartDate}
      onEdit={onEditTodate}
    />
  ) : (
    <>
      {/* Small screens: placeholder / empty message */}
      <div className="md:hidden h-full flex items-center justify-center p-4">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          {isEmpty ? emptyMessage : 'Hover or tap an item on the timeline to view details.'}
        </p>
      </div>
      {/* md+: inline forms */}
      {defaultContent && (
        <div className="hidden md:flex flex-col h-full">
          {defaultContent}
        </div>
      )}
    </>
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-h-0 w-full flex flex-row ${isDragging ? 'select-none' : ''}`}
      style={timelineWidthStyle}
      aria-label="Todate timeline"
    >
      {/* Timeline bar column — fixed 25% on mobile; draggable width on md+; smooth transition */}
      <div
        className="relative flex flex-col min-h-0 shrink-0 w-1/4 md:w-(--timeline-width) transition-[width] duration-200 ease-out"
      >
        <TimelineBar
          items={barItems}
          minYear={minYear}
          maxYear={maxYear}
          onHover={handleHover}
          onSelect={handleSelect}
          selectedId={selectedId}
          onSpanChange={onSpanChange}
          className="flex-1 min-h-0 bg-stone-50 dark:bg-gray-900/50"
        />
        {/* Toggle right panel: top right of timeline column (left of draggable border), desktop only */}
        <button
          type="button"
          onClick={toggleRightPanel}
          aria-label={isRightPanelCollapsed ? 'Open right panel' : 'Close right panel'}
          className="hidden md:flex absolute top-0 right-0 z-10 p-2 rounded-lg text-gray-500 dark:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          <Icon
            src={isRightPanelCollapsed ? rightPanelOpenIcon : rightPanelCloseIcon}
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
          />
        </button>
      </div>

      {/* Resize handle: desktop only when panel is open */}
      {!isRightPanelCollapsed && (
        <div
          role="separator"
          aria-label="Resize timeline"
          tabIndex={0}
          onMouseDown={handleResizeStart}
          className="hidden md:flex shrink-0 w-1.5 flex-col items-stretch bg-gray-300 dark:bg-gray-600 border-l border-r border-gray-400 dark:border-gray-500 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        />
      )}

      {/* Right content area — smooth transition when collapsing */}
      <div
        className={`flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain transition-[flex-basis] duration-200 ease-out ${activeTodate ? 'pb-24 sm:pb-28' : 'pb-24 md:pb-0'}`}
      >
        {rightContent}
      </div>
    </div>
  );
};

export default TodateLine;
