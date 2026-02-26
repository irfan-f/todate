import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useHoverDelay } from '../hooks/useHoverDelay';
import type { TodateType, SchoolStartDate } from '../types';
import { todateToBarItem } from '../utils/timelineBar';
import TimelineBar, { type TimelineBarItem } from './TimelineBar';
import Todate from './Todate';
import Icon from './Icon';
import { icons } from '../icons';

const TIMELINE_WIDTH_STORAGE_KEY = 'todate-timeline-width-pct';
const MIN_TIMELINE_PCT = 15;
const MAX_TIMELINE_PCT = 100;
const DEFAULT_TIMELINE_PCT = 25;

const TimelineWorkspace = ({
  list,
  schoolStartDate,
  totalCount = 0,
  onEditTodate,
  minYear,
  maxYear,
  defaultContent,
  onActiveChange,
  onSpanChange,
  isRightPanelCollapsed = false,
  onRightPanelCollapsedChange,
  datasetsPanelCollapsed = false,
  onDatasetsPanelCollapsedChange,
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
  isRightPanelCollapsed?: boolean;
  onRightPanelCollapsedChange?: (collapsed: boolean) => void;
  datasetsPanelCollapsed?: boolean;
  onDatasetsPanelCollapsedChange?: (collapsed: boolean) => void;
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
  const timelineBarWidthPct = isRightPanelCollapsed ? 100 : timelineWidthPct;
  const timelineBarWidthStyle = { ['--timeline-width' as string]: `${timelineBarWidthPct}%` };
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHoverActive, resizeHoverHandlers] = useHoverDelay(200);
  const dragStartRef = useRef({ x: 0, widthPct: 0 });
  const lastSavedWidthPctRef = useRef(timelineWidthPct);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const widthToUse = isRightPanelCollapsed ? 100 : timelineWidthPct;
    dragStartRef.current = { x: e.clientX, widthPct: widthToUse };
    lastSavedWidthPctRef.current = widthToUse;
    if (isRightPanelCollapsed) onRightPanelCollapsedChange?.(false);
    setIsDragging(true);
  }, [timelineWidthPct, isRightPanelCollapsed, onRightPanelCollapsedChange]);

  const toggleRightPanel = useCallback(() => {
    onRightPanelCollapsedChange?.(!isRightPanelCollapsed);
  }, [isRightPanelCollapsed, onRightPanelCollapsedChange]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const deltaPx = e.clientX - dragStartRef.current.x;
      const deltaPct = (deltaPx / rect.width) * 100;
      const next = Math.min(MAX_TIMELINE_PCT, Math.max(MIN_TIMELINE_PCT, dragStartRef.current.widthPct + deltaPct));
      lastSavedWidthPctRef.current = next;
      setTimelineWidthPct(next);
    };
    const onUp = () => {
      setIsDragging(false);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TIMELINE_WIDTH_STORAGE_KEY, String(lastSavedWidthPctRef.current));
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
  const hasActive = activeTodate != null;

  useEffect(() => {
    onActiveChange?.(hasActive);
  }, [hasActive, onActiveChange]);

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
    isRightPanelCollapsed ? null : (
      <Todate
        data={activeTodate}
        schoolStartDate={schoolStartDate}
        onEdit={onEditTodate}
      />
    )
  ) : (
    <>
      <div className="md:hidden h-full flex items-center justify-center p-4">
        <p className="text-muted text-sm">
          {isEmpty ? emptyMessage : 'Hover or tap an item on the timeline to view details.'}
        </p>
      </div>
      {defaultContent && !isRightPanelCollapsed && (
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
      style={timelineBarWidthStyle}
      aria-label="Timeline workspace"
    >
      <div
        className="relative flex flex-col min-h-0 shrink-0 w-1/4 md:w-(--timeline-width) transition-[width] duration-200 ease-out bg-surface-panel/50"
      >
        <div className="hidden md:flex shrink-0 justify-between items-center min-h-[28px] py-0.5 px-1 border-b border-border">
          <button
            type="button"
            onClick={() => onDatasetsPanelCollapsedChange?.(!datasetsPanelCollapsed)}
            aria-label={datasetsPanelCollapsed ? 'Expand datasets panel' : 'Close datasets panel'}
            data-testid="datasets-panel-toggle"
            className="btn-icon-panel"
          >
            <Icon
              src={datasetsPanelCollapsed ? icons.panelCollapse : icons.panelExpand}
              className="w-4 h-4"
            />
          </button>
          <button
            type="button"
            onClick={toggleRightPanel}
            aria-label={isRightPanelCollapsed ? 'Open right panel' : 'Close right panel'}
            className="btn-icon-panel"
          >
            <Icon
              src={isRightPanelCollapsed ? icons.panelExpand : icons.panelCollapse}
              className="w-4 h-4"
            />
          </button>
        </div>
        <TimelineBar
          items={barItems}
          minYear={minYear}
          maxYear={maxYear}
          onHover={handleHover}
          onSelect={handleSelect}
          selectedId={selectedId}
          onSpanChange={onSpanChange}
          className="flex-1 min-h-0"
        />
      </div>
      {!isRightPanelCollapsed && (
        <div
          role="separator"
          aria-label="Resize timeline"
          tabIndex={0}
          onMouseDown={handleResizeStart}
          {...resizeHoverHandlers}
          className={`hidden md:flex shrink-0 w-1.5 flex-col items-stretch bg-border border-l border-r border-border cursor-col-resize transition-opacity duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset ${
            resizeHoverActive || isDragging ? 'opacity-80' : 'opacity-25'
          }`}
        />
      )}

      <div
        className={`flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain transition-[flex-basis] duration-200 ease-out ${activeTodate ? 'pb-24 sm:pb-28' : 'pb-24 md:pb-0'}`}
      >
        {rightContent}
      </div>
    </div>
  );
};

export default TimelineWorkspace;
