import { useState, useMemo, useRef, useEffect } from 'react';
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
import hourglassUpIcon from './assets/hourglass_up.svg?raw';
import hourglassDownIcon from './assets/hourglass_down.svg?raw';
import starIcon from './assets/star.svg?raw';
import tagIcon from './assets/tag.svg?raw';
import schoolIcon from './assets/school.svg?raw';
import { useTheme } from './hooks/useTheme';
import ThemeToggle from './components/ThemeToggle';
import { headerNavButtonClass, fabSubButtonClass, fabMainButtonClass, fabSettingsButtonClass } from './constants/ui';

function getYearFromTodate(todate: TodateType): number {
  return new Date(todate.date).getFullYear();
}

function sortByTodate(a: TodateType, b: TodateType, order: 'asc' | 'desc') {
  const aVal = new Date(a.date).valueOf();
  const bVal = new Date(b.date).valueOf();
  return order === 'desc' ? bVal - aVal : aVal - bVal;
}

function App() {
  const [todates, setTodates] = useState<TodatesType>({});
  const [tags, setTags] = useState<TagsType>({});
  const [schoolStartDate, setSchoolStartDate] = useState<SchoolStartDate | null>(null);
  const [isTodateFormModalOpen, setIsTodateFormModalOpen] = useState(false);
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);
  const [editingTodate, setEditingTodate] = useState<TodateType | null>(null);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  const todatesList = useMemo(() => Object.values(todates), [todates]);
  const totalCount = todatesList.length;

  const { minYear, maxYear } = useMemo(() => {
    if (todatesList.length === 0) {
      const y = new Date().getFullYear();
      return { minYear: y, maxYear: y };
    }
    const years = todatesList.map(getYearFromTodate);
    return { minYear: Math.min(...years), maxYear: Math.max(...years) };
  }, [todatesList]);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showUntagged, setShowUntagged] = useState(true);
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);
  const [yearFilterTouched, setYearFilterTouched] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [isSchoolDataModalOpen, setIsSchoolDataModalOpen] = useState(false);
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

  const effectiveStartYear = yearFilterTouched
    ? Math.max(minYear, Math.min(startYear, endYear))
    : minYear;
  const effectiveEndYear = yearFilterTouched
    ? Math.min(maxYear, Math.max(startYear, endYear))
    : maxYear;

  const handleStartYearChange = (v: number) => {
    setYearFilterTouched(true);
    setStartYear(v);
  };
  const handleEndYearChange = (v: number) => {
    setYearFilterTouched(true);
    setEndYear(v);
  };

  const filteredAndSorted = useMemo(() => {
    let list = todatesList;
    if (selectedTagIds.length > 0) {
      list = list.filter((todate) =>
        todate.tags.some((t) => selectedTagIds.includes(t._id))
      );
    }
    if (!showUntagged) {
      list = list.filter((todate) => todate.tags.length > 0);
    }
    list = list.filter((todate) => {
      const y = getYearFromTodate(todate);
      return y >= effectiveStartYear && y <= effectiveEndYear;
    });
    return [...list].sort((a, b) => sortByTodate(a, b, sortOrder));
  }, [todatesList, selectedTagIds, showUntagged, effectiveStartYear, effectiveEndYear, sortOrder]);

  const tagList = useMemo(() => Object.values(tags), [tags]);

  const hasFilters = selectedTagIds.length > 0 || !showUntagged || yearFilterTouched;

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
          aria-label="Sort, filter, and create"
        >
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            aria-label={sortOrder === 'desc' ? 'Sort newest first (click for oldest first)' : 'Sort oldest first (click for newest first)'}
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
            className={headerNavButtonClass}
          >
            <Icon
              src={sortOrder === 'desc' ? hourglassDownIcon : hourglassUpIcon}
              className="w-6 h-6 sm:w-5 sm:h-5 text-gray-800 dark:text-gray-200"
            />
          </button>

          <TimelineFilters
            tagList={tagList}
            selectedTagIds={selectedTagIds}
            toggleTag={toggleTag}
            showUntagged={showUntagged}
            onShowUntaggedChange={setShowUntagged}
            minYear={minYear}
            maxYear={maxYear}
            effectiveStartYear={effectiveStartYear}
            effectiveEndYear={effectiveEndYear}
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
              className={headerNavButtonClass}
            >
              <Icon
                src={hasFilters ? filterListIcon : filterListOffIcon}
                className="w-6 h-6 sm:w-5 sm:h-5 text-gray-800 dark:text-gray-200"
              />
            </button>
          </TimelineFilters>
        </nav>
      </header>

      {/* FAB area: Settings (minifab) + Create — adjacent, settings smaller */}
      <div
        ref={fabAreaRef}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 flex flex-row items-end gap-2 sm:gap-3"
      >
        {/* School FAB: opens school data modal */}
        <button
          type="button"
          onClick={toggleSchoolDataModal}
          aria-label="School data"
          className={fabSettingsButtonClass}
        >
          <Icon src={schoolIcon} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {/* Create FAB column */}
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
              className={fabSubButtonClass}
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
              className={fabSubButtonClass}
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
          className={fabMainButtonClass}
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
          list={filteredAndSorted}
          totalCount={totalCount}
          schoolStartDate={schoolStartDate}
          onEditTodate={openEditTodate}
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
