import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Store } from '../types';
import type { NormalizedImport } from '../storage/exportImport';
import Modal from './Modal';
import Icon from './Icon';
import { icons } from '../icons';

type ImportStrategy = 'replace' | 'merge' | 'add';

interface DatasetsViewProps {
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
      title={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      className="btn-icon"
    >
      {children}
    </button>
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

  const closeDatasetMenu = useCallback(() => {
    setDatasetMenuOpenId(null);
    setDatasetMenuPosition(null);
  }, []);

  useEffect(() => {
    if (!datasetMenuOpenId) return;
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
      closeDatasetMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [datasetMenuOpenId, closeDatasetMenu]);

  const closeDriveMenu = useCallback(() => {
    setDriveMenuOpen(false);
    setDriveMenuPosition(null);
  }, []);

  useEffect(() => {
    if (!driveMenuOpen) return;
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
      closeDriveMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [driveMenuOpen, closeDriveMenu]);

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
    <div className="flex-1 min-h-0 flex flex-col bg-surface-panel/50">
      <div className="shrink-0 flex items-center justify-between gap-1 px-2 py-1.5 border-b border-border bg-surface-panel min-h-[32px]">
        <span className="text-xs font-medium text-muted shrink-0">Lines</span>
        <div className="flex items-center gap-0.5 ml-auto">
          <ToolbarIconBtn onClick={onAddDataset} ariaLabel="Create new line">
            <Icon src={icons.addSimple} className="w-3.5 h-3.5" />
          </ToolbarIconBtn>
          <ToolbarIconBtn onClick={handleImportClick} ariaLabel="Import backup">
            <Icon src={icons.upload} className="w-3.5 h-3.5" />
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
            <Icon src={icons.download} className="w-3.5 h-3.5" />
          </ToolbarIconBtn>
          {driveSyncAvailable && (
            <span ref={driveMenuTriggerRef}>
              <ToolbarIconBtn
                onClick={() => setDriveMenuOpen((o) => !o)}
                ariaLabel="Google Drive"
                ariaExpanded={driveMenuOpen}
                ariaHaspopup="menu"
              >
                <Icon src={icons.drive} className="w-4 h-4 shrink-0" />
              </ToolbarIconBtn>
            </span>
          )}
        </div>
      </div>
      {driveMessage && (
        <div
          className={`shrink-0 px-3 py-2 text-sm flex items-center gap-2 ${
            driveMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
          role="status"
        >
          {driveMessage.type === 'success' && (
            <Icon src={icons.uploadDownloadDone} className="w-4 h-4 shrink-0" />
          )}
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
                    : 'border-border bg-surface-panel hover:border-primary/50'
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
                    <Icon src={icons.star} className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
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
                      className="flex-1 min-w-0 rounded px-0.5 py-0.5 text-sm font-medium bg-primary/20 text-on-surface border border-primary/50 focus:outline-none focus:ring-1 focus:ring-focus cursor-text"
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
                      <Icon src={icons.star} className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                      <div className="min-w-0 flex-1 overflow-hidden min-h-6 flex items-center">
                        <div className="font-medium text-on-surface text-sm truncate">
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
                        title={`Actions for ${ds.name}`}
                        aria-expanded={datasetMenuOpenId === ds.id}
                        aria-haspopup="menu"
                        className="btn-icon shrink-0 min-w-6 min-h-6"
                      >
                        <Icon src={icons.moreVertical} className="w-3.5 h-3.5" />
                      </button>
                      {datasetMenuOpenId === ds.id &&
                        datasetMenuPosition &&
                        createPortal(
                          <div
                            ref={datasetMenuRef}
                            role="menu"
                            className="fixed z-[200] min-w-32 rounded-lg border border-border bg-surface-panel shadow-lg py-1 flex flex-col"
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
                                closeDatasetMenu();
                              }}
                              className="menu-item"
                            >
                              <Icon src={icons.download} className="w-3.5 h-3.5" />
                              Export
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameOpen(ds.id);
                                closeDatasetMenu();
                              }}
                              className="menu-item"
                            >
                              <Icon src={icons.edit} className="w-3.5 h-3.5" />
                              Rename
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(ds.id);
                                  closeDatasetMenu();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-secondary/50 text-left cursor-pointer"
                              >
                                <Icon src={icons.delete} className="w-3.5 h-3.5" />
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
            className="fixed z-[200] min-w-40 rounded-lg border border-border bg-surface-panel shadow-lg py-1"
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
                closeDriveMenu();
              }}
              className="menu-item"
            >
              <Icon src={icons.upload} className="w-3.5 h-3.5" />
              Save to Drive
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLoadFromDrive();
                closeDriveMenu();
              }}
              className="menu-item"
            >
              <Icon src={icons.download} className="w-3.5 h-3.5" />
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
              <p className="text-on-surface">
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
              <p className="text-on-surface">{importError}</p>
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
              <p className="text-sm text-muted">
                Import &quot;{pendingImport.name}&quot; ({Object.keys(pendingImport.todates).length} todates,{' '}
                {Object.keys(pendingImport.tags).length} tags):
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onImportStrategy('replace')}
                  className="option-btn"
                >
                  Replace current dataset
                </button>
                <button
                  type="button"
                  onClick={() => onImportStrategy('merge')}
                  className="option-btn"
                >
                  Merge into current dataset
                </button>
                <button
                  type="button"
                  onClick={() => onImportStrategy('add')}
                  className="option-btn"
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
