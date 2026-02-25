import { useState, useRef, useEffect } from 'react';
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

/** Bordered outline folder icon (no fill). */
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

/** Small toolbar icon button. */
function ToolbarIconBtn({
  onClick,
  ariaLabel,
  ariaExpanded,
  ariaHaspopup,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'menu';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      className="inline-flex items-center justify-center p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
    >
      {children}
    </button>
  );
}

const iconClass = 'w-3.5 h-3.5';
const iconStroke = 'currentColor';
const strokeProps = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function AddIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden {...strokeProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden {...strokeProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden {...strokeProps}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden {...strokeProps}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}
function MoreVerticalIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden {...strokeProps}>
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}
function DriveIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={iconStroke} aria-hidden strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10l-6 10-3-5 6-10 3 5" />
      <path d="M9 15h12l-3 5H9" />
      <path d="M15 15l-6-10h6l6 10-6 0" />
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
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameCancelRef = useRef(false);

  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const [driveMenuPosition, setDriveMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const driveMenuRef = useRef<HTMLDivElement | null>(null);
  const driveMenuTriggerRef = useRef<HTMLSpanElement | null>(null);

  const [datasetMenuOpenId, setDatasetMenuOpenId] = useState<string | null>(null);
  const [datasetMenuPosition, setDatasetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const datasetMenuRef = useRef<HTMLDivElement | null>(null);
  const datasetMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!datasetMenuOpenId) {
      setDatasetMenuPosition(null);
      return;
    }
    const trigger = datasetMenuTriggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setDatasetMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [datasetMenuOpenId]);

  useEffect(() => {
    if (!datasetMenuOpenId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        datasetMenuRef.current?.contains(target) ||
        datasetMenuTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setDatasetMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [datasetMenuOpenId]);

  useEffect(() => {
    if (!driveMenuOpen) {
      setDriveMenuPosition(null);
      return;
    }
    const trigger = driveMenuTriggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setDriveMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [driveMenuOpen]);

  useEffect(() => {
    if (!driveMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        driveMenuRef.current?.contains(target) ||
        driveMenuTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setDriveMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [driveMenuOpen]);

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
    if (!renameCancelRef.current && renamingId && renameValue.trim()) {
      onRenameDataset(renamingId, renameValue.trim());
    }
    renameCancelRef.current = false;
    setRenamingId(null);
    setRenameValue('');
  };

  useEffect(() => {
    if (!renamingId) return;
    const t = setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [renamingId]);

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
    <div className="flex-1 min-h-0 flex flex-col bg-stone-50 dark:bg-gray-900/50">
      <div className="shrink-0 flex items-center justify-between gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[32px]">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Lines</span>
        <div className="flex items-center gap-0.5 ml-auto">
          <ToolbarIconBtn onClick={onAddDataset} ariaLabel="Create dataset">
            <AddIcon />
          </ToolbarIconBtn>
          <ToolbarIconBtn onClick={handleImportClick} ariaLabel="Import backup">
            <ImportIcon />
          </ToolbarIconBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-hidden
            onChange={handleFileChange}
          />
          <ToolbarIconBtn onClick={onExportAll} ariaLabel="Export all (backup)">
            <ExportIcon />
          </ToolbarIconBtn>
          {driveSyncAvailable && (
            <span ref={driveMenuTriggerRef}>
              <ToolbarIconBtn
                onClick={() => setDriveMenuOpen((o) => !o)}
                ariaLabel="Google Drive"
                ariaExpanded={driveMenuOpen}
                ariaHaspopup="menu"
              >
                <DriveIcon />
              </ToolbarIconBtn>
            </span>
          )}
        </div>
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">
        <ul className="list-none p-0 m-0 flex flex-col gap-1" role="list">
          {datasetList.map((ds) => {
            const isActive = store.activeId === ds.id;
            return (
              <li
                key={ds.id}
                className={`group/row flex items-center gap-1.5 rounded-lg border px-2 py-1.5 h-9 transition-colors ${
                  isActive
                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {renamingId === ds.id ? (
                  <form
                    className="flex-1 min-w-0 flex items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit();
                    }}
                  >
                    <FolderIcon className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          renameCancelRef.current = true;
                          setRenamingId(null);
                          setRenameValue('');
                        }
                      }}
                      className="flex-1 min-w-0 rounded px-0.5 py-0.5 text-sm font-medium bg-blue-500/20 dark:bg-blue-400/20 text-gray-900 dark:text-gray-100 border border-blue-500/50 dark:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-text"
                      aria-label="Rename dataset"
                    />
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenDataset(ds.id)}
                      className="flex-1 min-w-0 min-h-6 flex items-center gap-1.5 text-left cursor-pointer"
                      aria-label={`Open ${ds.name}`}
                    >
                      <FolderIcon className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                      <div className="min-w-0 flex-1 overflow-hidden min-h-6 flex items-center">
                        <div className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                          {ds.name}
                        </div>
                      </div>
                    </button>
                    <div className="relative shrink-0">
                      <button
                        ref={datasetMenuOpenId === ds.id ? datasetMenuTriggerRef : undefined}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDatasetMenuOpenId((prev) => (prev === ds.id ? null : ds.id));
                        }}
                        aria-label={`Actions for ${ds.name}`}
                        aria-expanded={datasetMenuOpenId === ds.id}
                        aria-haspopup="menu"
                        className="inline-flex shrink-0 min-w-6 min-h-6 items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
                      >
                        <MoreVerticalIcon />
                      </button>
                      {datasetMenuOpenId === ds.id &&
                        datasetMenuPosition &&
                        createPortal(
                          <div
                            ref={datasetMenuRef}
                            role="menu"
                            className="fixed z-[200] min-w-32 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 flex flex-col"
                            style={{
                              top: datasetMenuPosition.top,
                              left: datasetMenuPosition.left,
                            }}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportDataset(ds.id);
                                setDatasetMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left cursor-pointer"
                            >
                              <ExportIcon />
                              Export
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameOpen(ds.id);
                                setDatasetMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left cursor-pointer"
                            >
                              <EditIcon />
                              Rename
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(ds.id);
                                  setDatasetMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left cursor-pointer"
                              >
                                <DeleteIcon />
                                Delete
                              </button>
                            )}
                          </div>,
                          document.body
                        )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {driveMenuOpen &&
        driveMenuPosition &&
        createPortal(
          <div
            ref={driveMenuRef}
            role="menu"
            className="fixed z-[200] min-w-40 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
            style={{
              top: driveMenuPosition.top,
              left: driveMenuPosition.left,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSaveToDrive();
                setDriveMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <ExportIcon />
              Save to Drive
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLoadFromDrive();
                setDriveMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <ImportIcon />
              Load from Drive
            </button>
          </div>,
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
