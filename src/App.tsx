import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { TodateType, TodatesType, TagType, TagsType, SchoolStartDate } from './types';
import TodateForm from './components/TodateForm';
import TagForm from './components/TagForm';
import SchoolDataForm from './components/SchoolDataForm';
import TodateLine from './components/TodateLine';
import Modal from './components/Modal';
import Icon from './components/Icon';
import TimelineFilters from './components/TimelineFilters';

import filterListIcon from './assets/filter_list.svg?raw';
import filterListOffIcon from './assets/filter_list_off.svg?raw';
import starIcon from './assets/star.svg?raw';
import tagIcon from './assets/tag.svg?raw';
import schoolIcon from './assets/school.svg?raw';
import { useTheme } from './hooks/useTheme';
import ThemeToggle from './components/ThemeToggle';
function getYearFromTodate(todate: TodateType): number {
  return new Date(todate.date).getFullYear();
}

function App() {
  const [todates, setTodates] = useState<TodatesType>({});
  const [tags, setTags] = useState<TagsType>({});
  const [schoolStartDate, setSchoolStartDate] = useState<SchoolStartDate | null>(null);

  // Load sample data only in dev when VITE_SAMPLE_DATA is set (npm run dev:sample).
  // sampleData.ts is gitignored and may not exist — suppress module resolution.
  const [sampleLoaded, setSampleLoaded] = useState(false);
  useEffect(() => {
    if (sampleLoaded) return;
    if (import.meta.env.DEV && import.meta.env.VITE_SAMPLE_DATA === 'true') {
      // @ts-ignore — optional dev-only file, not present in CI/production
      import(/* @vite-ignore */ '../sampleData').then((mod) => {
        setTodates(mod.sampleTodates as TodatesType);
        setTags(mod.sampleTags as TagsType);
        setSchoolStartDate(mod.sampleSchoolStartDate as SchoolStartDate);
        setSampleLoaded(true);
      }).catch(() => {
        console.warn('sampleData.ts not found at project root — starting with empty state');
      });
    }
  }, [sampleLoaded]);
  const [isTodateFormModalOpen, setIsTodateFormModalOpen] = useState(false);
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);
  const [editingTodate, setEditingTodate] = useState<TodateType | null>(null);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  const todatesList = useMemo(() => Object.values(todates), [todates]);
  const totalCount = todatesList.length;

  const { minYear, maxYear } = useMemo(() => {
    const y = new Date().getFullYear();
    if (todatesList.length === 0) {
      return { minYear: y - 1, maxYear: y + 1 };
    }
    const years = todatesList.map(getYearFromTodate);
    return { minYear: Math.min(...years), maxYear: Math.max(...years) };
  }, [todatesList]);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showUntagged, setShowUntagged] = useState(true);
  const [timelineStartYear, setTimelineStartYear] = useState(minYear);
  const [timelineEndYear, setTimelineEndYear] = useState(maxYear);
  const startYearRef = useRef(timelineStartYear);
  const endYearRef = useRef(timelineEndYear);
  startYearRef.current = timelineStartYear;
  endYearRef.current = timelineEndYear;

  // Sync timeline span when the data range changes (e.g. sample data loads, first todate added)
  const prevMinRef = useRef(minYear);
  const prevMaxRef = useRef(maxYear);
  useEffect(() => {
    if (minYear !== prevMinRef.current || maxYear !== prevMaxRef.current) {
      setTimelineStartYear(minYear);
      setTimelineEndYear(maxYear);
      prevMinRef.current = minYear;
      prevMaxRef.current = maxYear;
    }
  }, [minYear, maxYear]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [isSchoolDataModalOpen, setIsSchoolDataModalOpen] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [hasActiveTodate, setHasActiveTodate] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const fabAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabAreaRef.current && !fabAreaRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fabOpen]);

  const MAX_SPAN = 200;
  const rawStart = Math.min(timelineStartYear, timelineEndYear);
  const rawEnd = Math.max(timelineStartYear, timelineEndYear);
  const effectiveStartYear = rawEnd - rawStart > MAX_SPAN ? rawEnd - MAX_SPAN : rawStart;
  const effectiveEndYear = rawEnd;

  const filtered = useMemo(() => {
    let list = todatesList;
    if (selectedTagIds.length > 0) {
      list = list.filter((todate) =>
        todate.tags.some((t) => selectedTagIds.includes(t._id))
      );
    }
    if (!showUntagged) {
      list = list.filter((todate) => todate.tags.length > 0);
    }
    return list;
  }, [todatesList, selectedTagIds, showUntagged]);

  const tagList = useMemo(() => Object.values(tags), [tags]);

  const hasFilters = selectedTagIds.length > 0 || !showUntagged;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const { theme, setTheme } = useTheme();

  function toggleTodateModal(): void {
    if (isTodateFormModalOpen) setEditingTodate(null);
    setIsTodateFormModalOpen((open) => !open);
  }
  function toggleTagModal(): void {
    if (isTagFormModalOpen) setEditingTag(null);
    setIsTagFormModalOpen((open) => !open);
  }

  function openEditTodate(todate: TodateType): void {
    setEditingTodate(todate);
    setIsTodateFormModalOpen(true);
  }

  function openEditTag(tag: TagType): void {
    setEditingTag(tag);
    setIsTagFormModalOpen(true);
  }

  function toggleSchoolDataModal(): void {
    setIsSchoolDataModalOpen((open) => !open);
  }

  function handleSaveSchoolData(data: SchoolStartDate): void {
    setSchoolStartDate(data);
    setIsSchoolDataModalOpen(false);
  }

  function addTodate(todateToAdd: TodateType): void {
    setTodates((prev) => ({ ...prev, [todateToAdd._id]: todateToAdd }));
    setEditingTodate(null);
    toggleTodateModal();
  }

  function updateTodate(updated: TodateType): void {
    setTodates((prev) => ({ ...prev, [updated._id]: updated }));
    setEditingTodate(null);
    toggleTodateModal();
  }

  function addTag(tagToAdd: TagType): void {
    setTags((prev) => ({ ...prev, [tagToAdd._id]: tagToAdd }));
    setEditingTag(null);
    toggleTagModal();
  }

  function updateTag(updated: TagType): void {
    setTags((prev) => ({ ...prev, [updated._id]: updated }));
    setEditingTag(null);
    toggleTagModal();
  }

  function inlineAddTodate(todateToAdd: TodateType): void {
    setTodates((prev) => ({ ...prev, [todateToAdd._id]: todateToAdd }));
    setFormResetKey((k) => k + 1);
  }

  function inlineAddTag(tagToAdd: TagType): void {
    setTags((prev) => ({ ...prev, [tagToAdd._id]: tagToAdd }));
    setFormResetKey((k) => k + 1);
  }

  const handleSpanChange = useCallback((start: number, end: number) => {
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    if (e - s > MAX_SPAN) {
      const center = (s + e) / 2;
      setTimelineStartYear(Math.round(center - MAX_SPAN / 2));
      setTimelineEndYear(Math.round(center + MAX_SPAN / 2));
    } else {
      setTimelineStartYear(s);
      setTimelineEndYear(e);
    }
  }, []);

  const handleStartYearChange = useCallback((v: number) => {
    setTimelineStartYear((prev) => {
      const next = v || prev;
      const end = endYearRef.current;
      return end - next > MAX_SPAN ? end - MAX_SPAN : next;
    });
  }, []);

  const handleEndYearChange = useCallback((v: number) => {
    setTimelineEndYear((prev) => {
      const next = v || prev;
      const start = startYearRef.current;
      return next - start > MAX_SPAN ? start + MAX_SPAN : next;
    });
  }, []);

  const defaultPanelContent = (
    <div className="h-full flex flex-col gap-3 p-3">
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 shrink-0">Create Todate</h2>
        <TodateForm
          key={`todate-inline-${formResetKey}`}
          tags={tags}
          addTodate={inlineAddTodate}
          toggleTagModal={toggleTagModal}
          onEditTag={openEditTag}
          schoolStartDate={schoolStartDate}
          compact
          onAddTag={inlineAddTag}
          onOpenSchoolData={toggleSchoolDataModal}
        />
      </div>
    </div>
  );

  return (
    <>
      <header
        className="w-full shrink-0 p-3 sm:p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 bg-gray-500 dark:bg-gray-700"
        role="banner"
      >
        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-100 dark:text-gray-200 justify-self-start">
          Todate
        </h1>

        <div className="justify-self-center">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <nav
          className="flex flex-row items-center gap-2 sm:gap-3 justify-self-end"
          aria-label="Filter and create"
        >
          <TimelineFilters
            tagList={tagList}
            selectedTagIds={selectedTagIds}
            toggleTag={toggleTag}
            showUntagged={showUntagged}
            onShowUntaggedChange={setShowUntagged}
            timelineStartYear={effectiveStartYear}
            timelineEndYear={effectiveEndYear}
            onStartYearChange={handleStartYearChange}
            onEndYearChange={handleEndYearChange}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            filtersRef={filtersRef}
          >
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              aria-controls={filtersOpen ? 'filters-panel' : undefined}
              aria-label="Open filters"
              className="btn-nav-header"
            >
              <Icon
                src={hasFilters ? filterListIcon : filterListOffIcon}
                className="w-6 h-6 sm:w-5 sm:h-5 text-gray-800 dark:text-gray-200"
              />
            </button>
          </TimelineFilters>
        </nav>
      </header>

      {/* School FAB: always visible */}
      <button
        type="button"
        onClick={toggleSchoolDataModal}
        aria-label="School data"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 fab-settings"
      >
        <Icon src={schoolIcon} className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Create FAB area: always on small screens; on md+ only when a todate is active */}
      <div
        ref={fabAreaRef}
        className={`${hasActiveTodate ? '' : 'md:hidden'} fixed bottom-6 right-20 sm:bottom-8 sm:right-24 z-30 flex flex-row items-end gap-2 sm:gap-3`}
      >
        <div className="flex flex-col items-end gap-2 sm:gap-3">
          {fabOpen && (
            <div className="flex flex-col sm:flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                toggleTodateModal();
              }}
              aria-label="Create new todate"
              className="fab-sub"
            >
              <Icon src={starIcon} className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              <span className="text-sm font-medium">Todate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                toggleTagModal();
              }}
              aria-label="Create new tag"
              className="fab-sub"
            >
              <Icon src={tagIcon} className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              <span className="text-sm font-medium">Tag</span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-expanded={fabOpen}
          aria-label={fabOpen ? 'Close create menu' : 'Create todate or tag'}
          className="fab-main"
          style={{ transform: fabOpen ? 'rotate(45deg)' : undefined }}
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 -960 960 960" aria-hidden>
            <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Z" />
          </svg>
        </button>
        </div>
      </div>

      <main id="main-content" className="flex-1 min-h-0 flex flex-col bg-stone-100 dark:bg-gray-800" role="main">
        <TodateLine
          list={filtered}
          totalCount={totalCount}
          schoolStartDate={schoolStartDate}
          onEditTodate={openEditTodate}
          minYear={effectiveStartYear}
          maxYear={effectiveEndYear}
          defaultContent={defaultPanelContent}
          onActiveChange={setHasActiveTodate}
          onSpanChange={handleSpanChange}
        />
      </main>

      {isTodateFormModalOpen &&
        createPortal(
          <Modal title={editingTodate ? 'Edit Todate' : 'Create a Todate'} closeFn={toggleTodateModal}>
            <TodateForm
              tags={tags}
              addTodate={addTodate}
              updateTodate={updateTodate}
              initialData={editingTodate ?? undefined}
              toggleTagModal={toggleTagModal}
              onEditTag={openEditTag}
              schoolStartDate={schoolStartDate}
              onOpenSchoolData={toggleSchoolDataModal}
            />
          </Modal>,
          document.body
        )}
      {isTagFormModalOpen &&
        createPortal(
          <Modal title={editingTag ? 'Edit Tag' : 'Create a Tag'} closeFn={toggleTagModal}>
            <TagForm
              key={editingTag?._id ?? 'create'}
              addTag={addTag}
              updateTag={updateTag}
              initialTag={editingTag ?? undefined}
            />
          </Modal>,
          document.body
        )}
      {isSchoolDataModalOpen &&
        createPortal(
          <Modal
            title={schoolStartDate ? 'Edit school data' : 'School data'}
            closeFn={toggleSchoolDataModal}
          >
            <SchoolDataForm
              key={schoolStartDate ? `edit-${schoolStartDate.referenceYear}-${schoolStartDate.month ?? 0}` : 'create'}
              initialData={schoolStartDate}
              onSave={handleSaveSchoolData}
            />
          </Modal>,
          document.body
        )}
    </>
  );
}

export default App;
