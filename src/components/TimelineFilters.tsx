import { useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
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
  useClickOutside(filtersRef, () => setFiltersOpen(false), filtersOpen);

  const [startYearInput, setStartYearInput] = useState<string>(String(timelineStartYear));
  const [endYearInput, setEndYearInput] = useState<string>(String(timelineEndYear));
  const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);

  const displayStartYear = editingField === 'start' ? startYearInput : String(timelineStartYear);
  const displayEndYear = editingField === 'end' ? endYearInput : String(timelineEndYear);

  const applyStartYear = () => {
    const n = Number(startYearInput);
    if (Number.isFinite(n) && n >= 1990 && n <= 2100) {
      onStartYearChange(n);
    } else {
      setStartYearInput(String(timelineStartYear));
    }
    setEditingField(null);
  };

  const applyEndYear = () => {
    const n = Number(endYearInput);
    if (Number.isFinite(n) && n >= 1990 && n <= 2100) {
      onEndYearChange(n);
    } else {
      setEndYearInput(String(timelineEndYear));
    }
    setEditingField(null);
  };

  const filtersPanelContent = (
    <div className="max-w-2xl space-y-3">
      <div>
        <span className="text-on-surface text-sm font-medium block mb-1.5">Tags</span>
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
              ${showUntagged ? 'bg-primary border-primary/50 text-white' : 'bg-secondary/80 border-transparent text-on-surface hover:border-border'}
            `}
          >
            Show untagged
          </span>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tags">
          {tagList.length === 0 ? (
            <span className="text-muted text-sm">No tags yet</span>
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
                      ${isSelected ? 'bg-primary border-primary/50 text-white' : 'bg-secondary/80 border-transparent text-on-surface hover:border-border'}
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
        <span className="text-on-surface text-sm font-medium block mb-1.5">Timeline span</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            <label htmlFor="timeline-start-year" className="text-on-surface text-sm font-medium shrink-0">
              From
            </label>
            <input
              id="timeline-start-year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={displayStartYear}
              onFocus={() => { setEditingField('start'); setStartYearInput(String(timelineStartYear)); }}
              onChange={(e) => setStartYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={applyStartYear}
              onKeyDown={(e) => e.key === 'Enter' && applyStartYear()}
              className="w-20 min-h-[44px] sm:min-h-[32px] px-3 py-2 sm:py-1.5 rounded border border-border bg-surface-input text-on-surface text-base sm:text-sm touch-manipulation tabular-nums"
              aria-label="Timeline start year"
            />
          </div>
          <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
            <label htmlFor="timeline-end-year" className="text-on-surface text-sm font-medium shrink-0">
              To
            </label>
            <input
              id="timeline-end-year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={displayEndYear}
              onFocus={() => { setEditingField('end'); setEndYearInput(String(timelineEndYear)); }}
              onChange={(e) => setEndYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={applyEndYear}
              onKeyDown={(e) => e.key === 'Enter' && applyEndYear()}
              className="w-20 min-h-[44px] sm:min-h-[32px] px-3 py-2 sm:py-1.5 rounded border border-border bg-surface-input text-on-surface text-base sm:text-sm touch-manipulation tabular-nums"
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
          className="absolute top-full right-0 mt-1 z-50 w-[min(100vw-1.5rem,28rem)] max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface-panel shadow-lg p-4 sm:p-3"
          role="dialog"
          aria-label="Filters"
        >
          {filtersPanelContent}
        </div>
      )}
    </div>
  );
}
