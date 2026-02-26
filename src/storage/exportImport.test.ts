/**
 * Tests for export payload (store and dataset), export filenames,
 * parseAndValidateImportFile, and applyImportStrategy (replace / merge / add).
 */
import { describe, it, expect } from 'vitest';
import type { Store, Dataset } from '../types';
import { isStore, isDataset } from '../types';
import * as exportImport from './exportImport';

function makeStore(overrides?: Partial<Store>): Store {
  const id = 'ds1';
  return {
    activeId: id,
    datasets: {
      [id]: {
        id,
        name: 'Default',
        todates: {},
        tags: {},
        schoolStartDate: null,
      },
    },
    ...overrides,
  };
}

function makeDataset(overrides?: Partial<Dataset>): Dataset {
  return {
    id: 'ds1',
    name: 'Work',
    todates: {},
    tags: {},
    schoolStartDate: null,
    ...overrides,
  };
}

describe('export payload and filenames', () => {
  it('export payload for store is valid Store shape (todate-backup.json)', () => {
    const store = makeStore();
    expect(isStore(store)).toBe(true);
    const serialized = JSON.stringify(store);
    const parsed = JSON.parse(serialized) as unknown;
    expect(isStore(parsed)).toBe(true);
  });

  it('export payload for store with multiple datasets is valid Store', () => {
    const store = makeStore({
      activeId: 'b',
      datasets: {
        a: makeDataset({ id: 'a', name: 'A' }),
        b: makeDataset({ id: 'b', name: 'B' }),
      },
    });
    expect(isStore(store)).toBe(true);
    expect(Object.keys(store.datasets)).toHaveLength(2);
  });

  it('export payload for dataset is valid Dataset shape (todate-profile-{name}.json)', () => {
    const dataset = makeDataset({ name: 'My Profile' });
    expect(isDataset(dataset)).toBe(true);
    expect(exportImport.getExportFilenameForDataset(dataset.name)).toBe('todate-profile-My_Profile.json');
  });

  it('getExportFilenameForDataset sanitizes name for filename', () => {
    expect(exportImport.getExportFilenameForDataset('Default')).toBe('todate-profile-Default.json');
    expect(exportImport.getExportFilenameForDataset('Work & Life')).toBe('todate-profile-Work___Life.json');
    expect(exportImport.getExportFilenameForDataset('a/b')).toBe('todate-profile-a_b.json');
  });
});

describe('parseAndValidateImportFile', () => {
  it('returns error for invalid JSON', () => {
    const result = exportImport.parseAndValidateImportFile('not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Invalid JSON');
  });

  it('accepts valid Store and returns normalized data from active dataset', () => {
    const store = makeStore({
      activeId: 'x',
      datasets: {
        x: makeDataset({ id: 'x', name: 'Imported', todates: { t1: { _id: 't1', title: 'T', date: '2020-01-01', tags: [] } as unknown as import('../types').TodateType }, tags: {} }),
      },
    });
    const result = exportImport.parseAndValidateImportFile(JSON.stringify(store));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Imported');
      expect(Object.keys(result.data.todates)).toHaveLength(1);
    }
  });

  it('accepts Store with empty datasets and returns error', () => {
    const result = exportImport.parseAndValidateImportFile(JSON.stringify({ activeId: '', datasets: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('no datasets');
  });

  it('accepts single-dataset payload (todates, tags, optional name and schoolStartDate)', () => {
    const payload = { todates: {}, tags: {}, name: 'Profile' };
    const result = exportImport.parseAndValidateImportFile(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Profile');
      expect(result.data.todates).toEqual({});
      expect(result.data.tags).toEqual({});
      expect(result.data.schoolStartDate).toBeNull();
    }
  });

  it('uses "Imported" when single-dataset payload has no name', () => {
    const result = exportImport.parseAndValidateImportFile(JSON.stringify({ todates: {}, tags: {} }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe('Imported');
  });

  it('returns error for invalid shape', () => {
    const result = exportImport.parseAndValidateImportFile(JSON.stringify({ foo: 'bar' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Invalid format');
  });
});

describe('applyImportStrategy', () => {
  it('replace: overwrites current dataset with imported data', () => {
    const store = makeStore();
    const data: exportImport.NormalizedImport = {
      name: 'Replaced',
      todates: { x: { _id: 'x', title: 'X', date: '2021-01-01', tags: [] } as unknown as import('../types').TodateType },
      tags: {},
      schoolStartDate: null,
    };
    const next = exportImport.applyImportStrategy(store, data, 'replace');
    const ds = next.datasets[store.activeId];
    expect(ds).toBeDefined();
    if (!ds) return;
    expect(ds.name).toBe('Default');
    expect(ds.todates).toEqual(data.todates);
    expect(ds.tags).toEqual(data.tags);
  });

  it('merge: merges todates and tags by id into current dataset', () => {
    const store = makeStore({
      datasets: {
        ds1: makeDataset({
          id: 'ds1',
          name: 'Current',
          todates: { a: { _id: 'a', title: 'A', date: '2020-01-01', tags: [] } as unknown as import('../types').TodateType },
          tags: { t1: { _id: 't1-t2-t3-t4-t5', name: 'T1', color: '#f00' } },
        }),
      },
    });
    const data: exportImport.NormalizedImport = {
      name: 'Imported',
      todates: { b: { _id: 'b', title: 'B', date: '2021-01-01', tags: [] } as unknown as import('../types').TodateType },
      tags: { t2: { _id: 't2-t3-t4-t5-t6', name: 'T2', color: '#0f0' } },
      schoolStartDate: null,
    };
    const next = exportImport.applyImportStrategy(store, data, 'merge');
    const current = next.datasets[store.activeId];
    expect(current).toBeDefined();
    if (!current) return;
    expect(Object.keys(current.todates)).toHaveLength(2);
    expect(current.todates.a).toBeDefined();
    expect(current.todates.b).toBeDefined();
    expect(Object.keys(current.tags)).toHaveLength(2);
    expect(current.tags.t1).toBeDefined();
    expect(current.tags.t2).toBeDefined();
  });

  it('add: creates new dataset with imported data and sets it active', () => {
    const store = makeStore();
    const data: exportImport.NormalizedImport = {
      name: 'New From Import',
      todates: {},
      tags: {},
      schoolStartDate: null,
    };
    const next = exportImport.applyImportStrategy(store, data, 'add');
    expect(Object.keys(next.datasets)).toHaveLength(2);
    expect(next.activeId).not.toBe(store.activeId);
    const newId = next.activeId;
    const newDs = next.datasets[newId];
    expect(newDs).toBeDefined();
    if (!newDs) return;
    expect(newDs.name).toBe('New From Import');
    expect(newDs.todates).toEqual({});
  });

  it('returns store unchanged when current dataset is missing', () => {
    const store = makeStore({ activeId: 'nonexistent' });
    const data: exportImport.NormalizedImport = { name: 'X', todates: {}, tags: {}, schoolStartDate: null };
    const next = exportImport.applyImportStrategy(store, data, 'replace');
    expect(next).toBe(store);
  });
});
