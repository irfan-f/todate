import { useEffect } from 'react';
import type { TagType } from '../types';

export interface TimelineFiltersProps {
  tagList: TagType[];
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  showUntagged: boolean;
  onShowUntaggedChange: (show: boolean) => void;
  timelineStartYear: number;
  timelineEndYear: number;
  onStartYearChange: (v: number) => void;
  onEndYearChange: (v: number) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  filtersRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export default function TimelineFilters({
  tagList,
  selectedTagIds,
  toggleTag,
  showUntagged,
  onShowUntaggedChange,
  timelineStartYear,
  timelineEndYear,
  onStartYearChange,
  onEndYearChange,
  filtersOpen,
  setFiltersOpen,
  filtersRef,
  children,
}: TimelineFiltersProps) {
  useEffect(() => {
    if (!filtersOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersOpen, setFiltersOpen, filtersRef]);

  const panel = (
    <div className="max-w-2xl space-y-3">
      <div>
        <span className="text-gray-200 dark:text-gray-300 text-sm font-medium block mb-1.5">Tags</span>
        <label className="inline-flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={showUntagged}
            onChange={(e) => onShowUntaggedChange(e.target.checked)}
            className="sr-only peer"
            aria-label="Show untagged todates"
          />
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-sm font-medium
              transition-colors border-2 touch-manipulation
              ${showUntagged ? 'bg-gray-500 dark:bg-gray-500 border-gray-300 dark:border-gray-400 text-gray-100' : 'bg-gray-700/80 dark:bg-gray-600 border-transparent text-gray-300 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-400'}
            `}
          >
            Show untagged
          </span>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tags">
          {tagList.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm">No tags yet</span>
          ) : (
            tagList.map((tag) => {
              const isSelected = selectedTagIds.includes(tag._id);
              return (
                <label key={tag._id} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTag(tag._id)}
                    className="sr-only peer"
                    aria-label={`Filter by ${tag.name}`}
                  />
                  <span
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-sm font-medium
                      transition-colors border-2 touch-manipulation
                      ${isSelected ? 'bg-gray-500 dark:bg-gray-500 border-gray-300 dark:border-gray-400 text-gray-100' : 'bg-gray-700/80 dark:bg-gray-600 border-transparent text-gray-300 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-400'}
                    `}
                    style={
                      isSelected
                        ? { borderColor: tag.color, backgroundColor: `${tag.color}40` }
                        : undefined
                    }
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded shrink-0"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden
                    />
                    {tag.name}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div>
        <span className="text-gray-200 dark:text-gray-300 text-sm font-medium block mb-1.5">Timeline span</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            <label htmlFor="timeline-start-year" className="text-gray-200 dark:text-gray-300 text-sm font-medium shrink-0">
              From
            </label>
            <input
              id="timeline-start-year"
              type="number"
              value={timelineStartYear}
              onChange={(e) => onStartYearChange(Number(e.target.value) || timelineStartYear)}
              className="w-20 min-h-[44px] sm:min-h-[32px] px-3 py-2 sm:py-1.5 rounded border border-gray-500 dark:border-gray-500 bg-gray-700 dark:bg-gray-600 text-gray-100 text-base sm:text-sm touch-manipulation"
              aria-label="Timeline start year"
            />
          </div>
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            <label htmlFor="timeline-end-year" className="text-gray-200 dark:text-gray-300 text-sm font-medium shrink-0">
              To
            </label>
            <input
              id="timeline-end-year"
              type="number"
              value={timelineEndYear}
              onChange={(e) => onEndYearChange(Number(e.target.value) || timelineEndYear)}
              className="w-20 min-h-[44px] sm:min-h-[32px] px-3 py-2 sm:py-1.5 rounded border border-gray-500 dark:border-gray-500 bg-gray-700 dark:bg-gray-600 text-gray-100 text-base sm:text-sm touch-manipulation"
              aria-label="Timeline end year"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={filtersRef} className="relative">
      {children}
      {filtersOpen && (
        <div
          id="filters-panel"
          className="absolute top-full right-0 mt-1 z-50 w-[min(100vw-1.5rem,28rem)] max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain rounded-lg border border-gray-500 dark:border-gray-600 bg-stone-200 dark:bg-gray-700 shadow-lg p-4 sm:p-3"
          role="dialog"
          aria-label="Filters"
        >
          {panel}
        </div>
      )}
    </div>
  );
}
