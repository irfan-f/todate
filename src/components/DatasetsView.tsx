import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Store } from '../types';
import type { NormalizedImport } from '../storage/exportImport';
import Modal from './Modal';

type ImportStrategy = 'replace' | 'merge' | 'add';

type DatasetsViewProps = {
  store: Store;
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

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}

export default function DatasetsView({
  store,
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
}: DatasetsViewProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const datasetList = Object.values(store.datasets);
  const canDelete = datasetList.length > 1;

  const handleRenameOpen = (id: string) => {
    const ds = store.datasets[id];
    if (ds) {
      setRenamingId(id);
      setRenameValue(ds.name);
    }
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      onRenameDataset(renamingId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      onDeleteDataset(deletingId);
      setDeletingId(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-stone-100 dark:bg-gray-800">
      <div className="shrink-0 flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={onAddDataset}
          className="btn-nav-header flex items-center gap-2 px-3"
          aria-label="Create dataset"
        >
          <FolderIcon className="w-5 h-5" />
          <span>New dataset</span>
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="btn-nav-header flex items-center gap-2 px-3"
          aria-label="Import backup"
        >
          <span>Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-hidden
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={onExportAll}
          className="btn-nav-header flex items-center gap-2 px-3"
          aria-label="Export all (backup)"
        >
          <span>Export all</span>
        </button>
        {driveSyncAvailable && (
          <>
            <button
              type="button"
              onClick={onSaveToDrive}
              className="btn-nav-header flex items-center gap-2 px-3"
              aria-label="Save to Google Drive"
            >
              <span>Save to Drive</span>
            </button>
            <button
              type="button"
              onClick={onLoadFromDrive}
              className="btn-nav-header flex items-center gap-2 px-3"
              aria-label="Load from Google Drive"
            >
              <span>Load from Drive</span>
            </button>
          </>
        )}
      </div>
      {driveMessage && (
        <div
          className={`shrink-0 px-3 py-2 text-sm ${
            driveMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
          role="status"
        >
          {driveMessage.text}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
        <ul className="list-none p-0 m-0 flex flex-col gap-2" role="list">
          {datasetList.map((ds) => {
            const todateCount = Object.keys(ds.todates).length;
            return (
              <li
                key={ds.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 hover:border-gray-300 dark:hover:border-gray-600"
              >
                <button
                  type="button"
                  onClick={() => onOpenDataset(ds.id)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left group"
                  aria-label={`Open ${ds.name}`}
                >
                  <FolderIcon className="w-8 h-8 shrink-0 text-amber-600 dark:text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {ds.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {todateCount} {todateCount === 1 ? 'todate' : 'todates'}
                    </div>
                  </div>
                </button>
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportDataset(ds.id);
                    }}
                    className="min-h-[36px] px-2 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={`Export ${ds.name}`}
                  >
                    <span className="text-sm font-medium">Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRenameOpen(ds.id)}
                    className="min-h-[36px] px-2 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={`Rename ${ds.name}`}
                  >
                    <span className="text-sm font-medium">Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(ds.id)}
                    disabled={!canDelete}
                    className="min-h-[36px] px-2 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={`Delete ${ds.name}`}
                  >
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {renamingId &&
        createPortal(
          <Modal
            title="Rename dataset"
            closeFn={() => {
              setRenamingId(null);
              setRenameValue('');
            }}
          >
            <div className="flex flex-col gap-3">
              <label htmlFor="rename-dataset-input" className="text-sm text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                id="rename-dataset-input"
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(null);
                    setRenameValue('');
                  }}
                  className="btn-nav-header px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenameSubmit}
                  disabled={!renameValue.trim()}
                  className="btn-nav-header px-3 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}

      {deletingId &&
        createPortal(
          <Modal
            title="Delete dataset"
            closeFn={() => setDeletingId(null)}
          >
            <div className="flex flex-col gap-3">
              <p className="text-gray-700 dark:text-gray-300">
                Delete &quot;{store.datasets[deletingId]?.name}&quot;? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="btn-nav-header px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="min-h-[44px] px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}

      {importError &&
        createPortal(
          <Modal title="Import failed" closeFn={onCloseImport}>
            <div className="flex flex-col gap-3">
              <p className="text-gray-700 dark:text-gray-300">{importError}</p>
              <div className="flex justify-end">
                <button type="button" onClick={onCloseImport} className="btn-nav-header px-3">
                  Close
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}

      {pendingImport &&
        createPortal(
          <Modal title="Import" closeFn={onCloseImport}>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import &quot;{pendingImport.name}&quot; ({Object.keys(pendingImport.todates).length} todates,{' '}
                {Object.keys(pendingImport.tags).length} tags):
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onImportStrategy('replace')}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-left px-3"
                >
                  Replace current dataset
                </button>
                <button
                  type="button"
                  onClick={() => onImportStrategy('merge')}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-left px-3"
                >
                  Merge into current dataset
                </button>
                <button
                  type="button"
                  onClick={() => onImportStrategy('add')}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-left px-3"
                >
                  Add as new dataset
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={onCloseImport} className="btn-nav-header px-3">
                  Cancel
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}
    </div>
  );
}
