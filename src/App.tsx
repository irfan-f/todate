import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { TodateType, TodatesType, TagType, TagsType, SchoolStartDate, Store, Dataset } from './types';
import TodateForm from './components/TodateForm';
import TagForm from './components/TagForm';
import SchoolDataForm from './components/SchoolDataForm';
import TimelineWorkspace from './components/TimelineWorkspace';
import DatasetsPanel from './components/DatasetsPanel';
import Modal from './components/Modal';
import Icon from './components/Icon';
import TimelineFilters from './components/TimelineFilters';
import { icons } from './icons';
import { useTheme } from './hooks/useTheme';
import { useClickOutside } from './hooks/useClickOutside';
import ThemeToggle from './components/ThemeToggle';
import { loadStore, saveStore } from './storage/local';
import { randomUUID } from './utils/id';
import * as exportImport from './storage/exportImport';
import type { NormalizedImport } from './storage/exportImport';
import { saveToDrive, loadFromDrive, isDriveSyncAvailable } from './storage/drive';

type ImportStrategy = 'replace' | 'merge' | 'add';

function getYearFromTodate(todate: TodateType): number {
  return new Date(todate.date).getFullYear();
}

function App() {
  const [store, setStore] = useState<Store>(() => loadStore());
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const activeDataset = store.datasets[store.activeId];
  const todates = useMemo(() => activeDataset?.todates ?? {}, [activeDataset?.todates]);
  const tags = useMemo(() => activeDataset?.tags ?? {}, [activeDataset?.tags]);
  const schoolStartDate = activeDataset?.schoolStartDate ?? null;

  const [sampleLoaded, setSampleLoaded] = useState(false);
  useEffect(() => {
    if (sampleLoaded || !activeDataset) return;
    if (import.meta.env.DEV && import.meta.env.VITE_SAMPLE_DATA === 'true') {
      const sampleDataPath = '../sampleData';
      interface SampleModule {
        sampleTodates: TodatesType;
        sampleTags: TagsType;
        sampleSchoolStartDate: SchoolStartDate;
      }
      import(/* @vite-ignore */ sampleDataPath)
        .then((mod: SampleModule) => {
          setStore((prev) => {
            const id = randomUUID();
            const newDs: Dataset = {
              id,
              name: 'Test Data',
              todates: mod.sampleTodates,
              tags: mod.sampleTags,
              schoolStartDate: mod.sampleSchoolStartDate,
            };
            return {
              ...prev,
              activeId: id,
              datasets: { ...prev.datasets, [id]: newDs },
            };
          });
          setSampleLoaded(true);
        })
        .catch(() => {
          console.warn('sampleData.ts not found at project root — starting with empty state');
        });
    }
  }, [sampleLoaded, activeDataset]);

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

  const previousDataRangeRef = useRef({ min: minYear, max: maxYear });
  useEffect(() => {
    if (minYear !== previousDataRangeRef.current.min || maxYear !== previousDataRangeRef.current.max) {
      setTimelineStartYear(minYear);
      setTimelineEndYear(maxYear);
      previousDataRangeRef.current = { min: minYear, max: maxYear };
    }
  }, [minYear, maxYear]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [isSchoolDataModalOpen, setIsSchoolDataModalOpen] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [hasActiveTodate, setHasActiveTodate] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [datasetsPanelCollapsed, setDatasetsPanelCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const filtersRef = useRef<HTMLDivElement>(null);
  const fabAreaRef = useRef<HTMLDivElement>(null);

  const [pendingImport, setPendingImport] = useState<NormalizedImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [driveMessage, setDriveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useClickOutside(fabAreaRef, () => setFabOpen(false), fabOpen);

  const driveSyncAvailable = isDriveSyncAvailable();

  const MAX_SPAN = 200;
  const clampedStartYear = Math.min(timelineStartYear, timelineEndYear);
  const clampedEndYear = Math.max(timelineStartYear, timelineEndYear);
  const effectiveStartYear = clampedEndYear - clampedStartYear > MAX_SPAN ? clampedEndYear - MAX_SPAN : clampedStartYear;
  const effectiveEndYear = clampedEndYear;

  const filtered = useMemo(() => {
    let list = todatesList;
    if (selectedTagIds.length > 0) {
      list = list.filter((todate) => todate.tags.some((t) => selectedTagIds.includes(t._id)));
    }
    if (!showUntagged) {
      list = list.filter((todate) => todate.tags.length > 0);
    }
    return list;
  }, [todatesList, selectedTagIds, showUntagged]);

  const tagList = useMemo(() => Object.values(tags), [tags]);
  const hasFilters = selectedTagIds.length > 0 || !showUntagged;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const { theme, setTheme } = useTheme();

  const updateActiveDataset = useCallback((updater: (ds: Dataset) => Dataset) => {
    setStore((prev) => {
      const ds = prev.datasets[prev.activeId];
      if (!ds) return prev;
      return {
        ...prev,
        datasets: { ...prev.datasets, [prev.activeId]: updater(ds) },
      };
    });
  }, []);

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
    updateActiveDataset((ds) => ({ ...ds, schoolStartDate: data }));
    setIsSchoolDataModalOpen(false);
  }

  function addTodate(todateToAdd: TodateType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      todates: { ...ds.todates, [todateToAdd._id]: todateToAdd },
    }));
    setEditingTodate(null);
    toggleTodateModal();
  }

  function updateTodate(updated: TodateType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      todates: { ...ds.todates, [updated._id]: updated },
    }));
    setEditingTodate(null);
    toggleTodateModal();
  }

  function addTag(tagToAdd: TagType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      tags: { ...ds.tags, [tagToAdd._id]: tagToAdd },
    }));
    setEditingTag(null);
    toggleTagModal();
  }

  function updateTag(updated: TagType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      tags: { ...ds.tags, [updated._id]: updated },
    }));
    setEditingTag(null);
    toggleTagModal();
  }

  function inlineAddTodate(todateToAdd: TodateType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      todates: { ...ds.todates, [todateToAdd._id]: todateToAdd },
    }));
    setFormResetKey((k) => k + 1);
  }

  function inlineAddTag(tagToAdd: TagType): void {
    updateActiveDataset((ds) => ({
      ...ds,
      tags: { ...ds.tags, [tagToAdd._id]: tagToAdd },
    }));
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

  const handleAddDataset = useCallback(() => {
    const id = randomUUID();
    const newDs: Dataset = {
      id,
      name: 'New dataset',
      todates: {},
      tags: {},
      schoolStartDate: null,
    };
    setStore((prev) => ({
      ...prev,
      activeId: id,
      datasets: { ...prev.datasets, [id]: newDs },
    }));
  }, []);

  const handleOpenDataset = useCallback((datasetId: string) => {
    setStore((prev) => (prev.activeId === datasetId ? prev : { ...prev, activeId: datasetId }));
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setDatasetsPanelCollapsed(true);
    }
  }, []);

  const handleRenameDataset = useCallback((datasetId: string, newName: string) => {
    setStore((prev) => {
      const ds = prev.datasets[datasetId];
      if (!ds) return prev;
      return {
        ...prev,
        datasets: { ...prev.datasets, [datasetId]: { ...ds, name: newName.trim() } },
      };
    });
  }, []);

  const handleDeleteDataset = useCallback((datasetId: string) => {
    setStore((prev) => {
      const ids = Object.keys(prev.datasets).filter((id) => id !== datasetId);
      if (ids.length === 0) return prev;
      const nextActive = prev.activeId === datasetId ? (ids[0] ?? prev.activeId) : prev.activeId;
      const nextDatasets = { ...prev.datasets };
      delete nextDatasets[datasetId];
      return { activeId: nextActive, datasets: nextDatasets };
    });
  }, []);

  const handleExportAll = useCallback(() => {
    exportImport.exportStore(store);
  }, [store]);

  const handleExportDataset = useCallback(
    (datasetId: string) => {
      const ds = store.datasets[datasetId];
      if (ds) exportImport.exportDataset(ds);
    },
    [store]
  );

  const handleImport = useCallback((file: File) => {
    setImportError(null);
    setPendingImport(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = exportImport.parseAndValidateImportFile(text);
      if (result.ok) {
        setPendingImport(result.data);
      } else {
        setImportError(result.error);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImportStrategy = useCallback(
    (strategy: ImportStrategy) => {
      if (!pendingImport) return;
      setStore((prev) => exportImport.applyImportStrategy(prev, pendingImport, strategy));
      setPendingImport(null);
      setImportError(null);
    },
    [pendingImport]
  );

  const handleCloseImport = useCallback(() => {
    setPendingImport(null);
    setImportError(null);
  }, []);

  const handleSaveToDrive = useCallback(async () => {
    setDriveMessage(null);
    try {
      await saveToDrive(store);
      setDriveMessage({ type: 'success', text: 'Saved to Google Drive' });
      setTimeout(() => setDriveMessage(null), 3000);
    } catch (e) {
      setDriveMessage({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    }
  }, [store]);

  const handleLoadFromDrive = useCallback(async () => {
    setDriveMessage(null);
    try {
      const loaded = await loadFromDrive();
      if (loaded) {
        setStore(loaded);
        setDriveMessage({ type: 'success', text: 'Loaded from Google Drive' });
        setTimeout(() => setDriveMessage(null), 3000);
      } else {
        setDriveMessage({ type: 'error', text: 'File not found or invalid' });
      }
    } catch (e) {
      setDriveMessage({ type: 'error', text: e instanceof Error ? e.message : 'Load failed' });
    }
  }, []);

  const inlineCreateForm = (
    <div className="h-full flex flex-col gap-3 p-3">
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border bg-surface-panel p-3 @container min-w-0 overflow-x-hidden">
        <h2 className="text-sm font-semibold text-on-surface mb-2 shrink-0">Create Todate</h2>
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
        className="w-full shrink-0 p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 bg-header text-on-surface"
        role="banner"
      >
        <div className="flex items-center gap-2 justify-self-start min-w-0">
          <button
            type="button"
            onClick={() => setDatasetsPanelCollapsed((c) => !c)}
            aria-label={datasetsPanelCollapsed ? 'Open datasets panel' : 'Close datasets panel'}
            aria-expanded={!datasetsPanelCollapsed}
            className="md:hidden btn-nav-header shrink-0"
          >
            <Icon src={icons.menu} className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-on-surface truncate">
            Todate
          </h1>
        </div>

        <div className="justify-self-center">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <nav className="flex flex-row items-center gap-2 sm:gap-3 justify-self-end" aria-label="Filter and create">
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
                src={hasFilters ? icons.filterList : icons.filterListOff}
                className="w-6 h-6 sm:w-5 sm:h-5 text-on-surface"
              />
            </button>
          </TimelineFilters>
        </nav>
      </header>

      <div
        ref={fabAreaRef}
        className={`${hasActiveTodate || rightPanelCollapsed ? '' : 'md:hidden'} fixed bottom-6 right-6 sm:bottom-8 z-30 flex flex-row items-end gap-2 sm:gap-3`}
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
                <Icon src={icons.star} className="w-5 h-5 text-on-surface" />
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
                <Icon src={icons.tag} className="w-5 h-5 text-on-surface" />
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
            <Icon src={icons.add} className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
        <button
          type="button"
          onClick={toggleSchoolDataModal}
          aria-label="Edit school data"
          className="fab-settings"
        >
          <Icon src={icons.school} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <main id="main-content" className="flex-1 min-h-0 flex flex-row min-w-0 bg-surface" role="main">
        <DatasetsPanel
          store={store}
          isCollapsed={datasetsPanelCollapsed}
          onPanelCollapsedChange={setDatasetsPanelCollapsed}
          onAddDataset={handleAddDataset}
          onOpenDataset={handleOpenDataset}
          onRenameDataset={handleRenameDataset}
          onDeleteDataset={handleDeleteDataset}
          onExportAll={handleExportAll}
          onExportDataset={handleExportDataset}
          onImport={handleImport}
          pendingImport={pendingImport}
          importError={importError}
          onImportStrategy={handleImportStrategy}
          onCloseImport={handleCloseImport}
          driveSyncAvailable={driveSyncAvailable}
          onSaveToDrive={() => { void handleSaveToDrive(); }}
          onLoadFromDrive={() => { void handleLoadFromDrive(); }}
          driveMessage={driveMessage}
        />
        <div className="flex-1 min-h-0 flex flex-col min-w-0">
          <TimelineWorkspace
            list={filtered}
            totalCount={totalCount}
            schoolStartDate={schoolStartDate}
            onEditTodate={openEditTodate}
            minYear={effectiveStartYear}
            maxYear={effectiveEndYear}
            defaultContent={inlineCreateForm}
            onActiveChange={setHasActiveTodate}
            onSpanChange={handleSpanChange}
            isRightPanelCollapsed={rightPanelCollapsed}
            onRightPanelCollapsedChange={setRightPanelCollapsed}
            datasetsPanelCollapsed={datasetsPanelCollapsed}
            onDatasetsPanelCollapsedChange={setDatasetsPanelCollapsed}
          />
        </div>
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
          <Modal title={schoolStartDate ? 'Edit school data' : 'School data'} closeFn={toggleSchoolDataModal}>
            <SchoolDataForm
              key={schoolStartDate ? `edit-${schoolStartDate.referenceYear}-${schoolStartDate.month ?? 0}` : 'create'}
              initialData={schoolStartDate}
              onSave={handleSaveSchoolData}
            />
          </Modal>,
          document.body
        )}
      {importError &&
        createPortal(
          <Modal title="Import failed" closeFn={handleCloseImport}>
            <div className="flex flex-col gap-3">
              <p className="text-on-surface">{importError}</p>
              <div className="flex justify-end">
                <button type="button" onClick={handleCloseImport} className="btn-nav-header px-3">
                  Close
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}
      {pendingImport &&
        createPortal(
          <Modal title="Import" closeFn={handleCloseImport}>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Import &quot;{pendingImport.name}&quot; ({Object.keys(pendingImport.todates).length} todates,{' '}
                {Object.keys(pendingImport.tags).length} tags):
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleImportStrategy('replace')}
                  className="option-btn"
                >
                  Replace current dataset
                </button>
                <button
                  type="button"
                  onClick={() => handleImportStrategy('merge')}
                  className="option-btn"
                >
                  Merge into current dataset
                </button>
                <button
                  type="button"
                  onClick={() => handleImportStrategy('add')}
                  className="option-btn"
                >
                  Add as new dataset
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleCloseImport} className="btn-nav-header px-3">
                  Cancel
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}
    </>
  );
}

export default App;
