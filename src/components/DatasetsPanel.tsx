import { useState, useEffect, useRef, useCallback } from 'react';
import DatasetsView from './DatasetsView';
import type { Store } from '../types';
import type { NormalizedImport } from '../storage/exportImport';

const WIDTH_STORAGE_KEY = 'todate-datasets-width-pct';
const MIN_PCT = 15;
const MAX_PCT = 40;
const DEFAULT_PCT = 20;

type ImportStrategy = 'replace' | 'merge' | 'add';

export type DatasetsPanelProps = {
  store: Store;
  isCollapsed: boolean;
  onPanelCollapsedChange?: (collapsed: boolean) => void;
  onAddDataset: () => void;
  onOpenDataset: (datasetId: string) => void;
  onRenameDataset: (datasetId: string, newName: string) => void;
  onDeleteDataset: (datasetId: string) => void;
  onExportAll: () => void;
  onExportDataset: (datasetId: string) => void;
  onImport: (file: File) => void;
  pendingImport: NormalizedImport | null;
  importError: string | null;
  onImportStrategy: (strategy: ImportStrategy) => void;
  onCloseImport: () => void;
  driveSyncAvailable: boolean;
  onSaveToDrive: () => void;
  onLoadFromDrive: () => void;
  driveMessage: { type: 'success' | 'error'; text: string } | null;
};

export default function DatasetsPanel({
  store,
  isCollapsed,
  onPanelCollapsedChange,
  onAddDataset,
  onOpenDataset,
  onRenameDataset,
  onDeleteDataset,
  onExportAll,
  onExportDataset,
  onImport,
  pendingImport,
  importError,
  onImportStrategy,
  onCloseImport,
  driveSyncAvailable,
  onSaveToDrive,
  onLoadFromDrive,
  driveMessage,
}: DatasetsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widthPct, setWidthPct] = useState(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_PCT;
    const stored = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (stored == null) return DEFAULT_PCT;
    const n = Number(stored);
    return Number.isFinite(n) && n >= MIN_PCT && n <= MAX_PCT ? n : DEFAULT_PCT;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, widthPct: 0 });
  const lastSavedWidthPctRef = useRef(widthPct);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const widthToUse = isCollapsed ? DEFAULT_PCT : widthPct;
      dragStartRef.current = { x: e.clientX, widthPct: widthToUse };
      lastSavedWidthPctRef.current = widthToUse;
      if (isCollapsed) onPanelCollapsedChange?.(false);
      setIsDragging(true);
    },
    [widthPct, isCollapsed, onPanelCollapsedChange]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;
      const parentWidth = parent.getBoundingClientRect().width;
      const deltaPx = e.clientX - dragStartRef.current.x;
      const deltaPct = (deltaPx / parentWidth) * 100;
      const next = Math.min(
        MAX_PCT,
        Math.max(MIN_PCT, dragStartRef.current.widthPct + deltaPct)
      );
      lastSavedWidthPctRef.current = next;
      setWidthPct(next);
    };
    const onUp = () => {
      setIsDragging(false);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WIDTH_STORAGE_KEY, String(lastSavedWidthPctRef.current));
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

  const panelWidthStyle = isCollapsed
    ? { width: 0, minWidth: 0, overflow: 'hidden' as const }
    : { width: `${widthPct}%`, minWidth: 120 };

  return (
    <>
      <div
        ref={containerRef}
        className={`flex flex-col min-h-0 shrink-0 transition-[width] duration-200 ease-out hidden md:flex ${
          isDragging ? 'select-none' : ''
        }`}
        style={panelWidthStyle}
        aria-label="Datasets panel"
      >
        {isCollapsed ? (
          <div className="flex-1 min-h-0 bg-stone-50 dark:bg-gray-900/50" aria-hidden />
        ) : (
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            <DatasetsView
              store={store}
              onAddDataset={onAddDataset}
              onOpenDataset={onOpenDataset}
              onRenameDataset={onRenameDataset}
              onDeleteDataset={onDeleteDataset}
              onExportAll={onExportAll}
              onExportDataset={onExportDataset}
              onImport={onImport}
              pendingImport={pendingImport}
              importError={importError}
              onImportStrategy={onImportStrategy}
              onCloseImport={onCloseImport}
              driveSyncAvailable={driveSyncAvailable}
              onSaveToDrive={onSaveToDrive}
              onLoadFromDrive={onLoadFromDrive}
              driveMessage={driveMessage}
            />
          </div>
        )}
      </div>
      {!isCollapsed && (
        <div
          role="separator"
          aria-label="Resize datasets panel"
          data-testid="datasets-panel-resize"
          tabIndex={0}
          onMouseDown={handleResizeStart}
          className="hidden md:flex shrink-0 w-1.5 flex-col items-stretch bg-gray-300 dark:bg-gray-600 border-l border-r border-gray-400 dark:border-gray-500 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        />
      )}
    </>
  );
}
