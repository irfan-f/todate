import type { Store, Dataset, TodatesType, TagsType, SchoolStartDate } from '../types';
import { isStore, isSingleDatasetPayload } from '../types';

/** Normalized result of parsing an import file: one dataset's content. */
export interface NormalizedImport {
  name: string;
  todates: TodatesType;
  tags: TagsType;
  schoolStartDate: SchoolStartDate | null;
}

export type ParseImportResult =
  | { ok: true; data: NormalizedImport }
  | { ok: false; error: string };

/**
 * Parse and validate import file content. Accepts either a full Store or a single-dataset payload.
 */
export function parseAndValidateImportFile(text: string): ParseImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }

  if (isStore(parsed)) {
    const store = parsed as Store;
    const ids = Object.keys(store.datasets);
    if (ids.length === 0) return { ok: false, error: 'File has no datasets' };
    const ds = store.datasets[store.activeId] ?? store.datasets[ids[0]!]!;
    return {
      ok: true,
      data: {
        name: ds.name,
        todates: ds.todates ?? {},
        tags: ds.tags ?? {},
        schoolStartDate: ds.schoolStartDate ?? null,
      },
    };
  }

  if (isSingleDatasetPayload(parsed)) {
    const p = parsed as { name?: string; todates: TodatesType; tags: TagsType; schoolStartDate?: SchoolStartDate | null };
    return {
      ok: true,
      data: {
        name: p.name?.trim() || 'Imported',
        todates: p.todates ?? {},
        tags: p.tags ?? {},
        schoolStartDate: p.schoolStartDate ?? null,
      },
    };
  }

  return { ok: false, error: 'Invalid format: expected a backup or profile file' };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'profile';
}

export function getExportFilenameForDataset(name: string): string {
  return `todate-profile-${sanitizeFilename(name)}.json`;
}

export function exportDataset(dataset: Dataset): void {
  downloadJson(getExportFilenameForDataset(dataset.name), dataset);
}

export function exportStore(store: Store): void {
  downloadJson('todate-backup.json', store);
}

/** Apply an import strategy to the store. Returns new store. */
export function applyImportStrategy(
  store: Store,
  data: NormalizedImport,
  strategy: 'replace' | 'merge' | 'add'
): Store {
  const currentId = store.activeId;
  const current = store.datasets[currentId];
  if (!current) return store;

  if (strategy === 'replace') {
    return {
      ...store,
      datasets: {
        ...store.datasets,
        [currentId]: {
          ...current,
          todates: data.todates,
          tags: data.tags,
          schoolStartDate: data.schoolStartDate ?? null,
        },
      },
    };
  }

  if (strategy === 'merge') {
    const mergedTodates = { ...current.todates, ...data.todates };
    const mergedTags = { ...current.tags, ...data.tags };
    return {
      ...store,
      datasets: {
        ...store.datasets,
        [currentId]: {
          ...current,
          todates: mergedTodates,
          tags: mergedTags,
          schoolStartDate: data.schoolStartDate ?? current.schoolStartDate ?? null,
        },
      },
    };
  }

  if (strategy === 'add') {
    const id = crypto.randomUUID();
    const newDs: Dataset = {
      id,
      name: data.name || 'Imported',
      todates: data.todates,
      tags: data.tags,
      schoolStartDate: data.schoolStartDate ?? null,
    };
    return {
      ...store,
      activeId: id,
      datasets: { ...store.datasets, [id]: newDs },
    };
  }

  return store;
}
