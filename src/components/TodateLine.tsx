import { useState, useMemo, useEffect } from 'react';
import type { TodateType, SchoolStartDate } from '../types';
import { dateValueToIso } from '../utils/date';
import TimelineBar, { type TimelineBarItem } from './TimelineBar';
import Todate from './Todate';

const FALLBACK_TAG_COLOR = '#9ca3af'; // gray-400

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
}: {
  list: TodateType[];
  schoolStartDate: SchoolStartDate | null;
  totalCount?: number;
  onEditTodate?: (todate: TodateType) => void;
  minYear?: number;
  maxYear?: number;
  defaultContent?: React.ReactNode;
  onActiveChange?: (hasActive: boolean) => void;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      className="flex-1 min-h-0 w-full flex flex-row"
      aria-label="Todate timeline"
    >
      {/* Timeline bar column (≤25%) */}
      <div className="flex flex-col min-h-0 w-1/4 max-w-[25%] shrink-0 border-r border-gray-300 dark:border-gray-600">
        <TimelineBar
          items={barItems}
          minYear={minYear}
          maxYear={maxYear}
          onHover={handleHover}
          onSelect={handleSelect}
          selectedId={selectedId}
          className="flex-1 min-h-0 bg-stone-50 dark:bg-gray-900/50"
        />
      </div>

      {/* Right content area (≥75%) */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${activeTodate ? 'pb-24 sm:pb-28' : 'pb-24 md:pb-0'}`}>
        {rightContent}
      </div>
    </div>
  );
};

export default TodateLine;
