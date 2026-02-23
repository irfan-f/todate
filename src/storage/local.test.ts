/**
 * Tests for loadStore, saveStore, and debounced save.
 * Uses in-memory localStorage mock; single key todate-store.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Store } from '../types'

const STORAGE_KEY = 'todate-store'

let loadStore: () => Store
let saveStore: (store: Store) => void

function createMockStorage(): Record<string, string> {
  const storage: Record<string, string> = {}
  return storage
}

function createLocalStorageMock(storage: Record<string, string>) {
  return {
    getItem(key: string): string | null {
      return key in storage ? storage[key] : null
    },
    setItem(key: string, value: string): void {
      storage[key] = value
    },
    removeItem(key: string): void {
      delete storage[key]
    },
  }
}

describe('loadStore', () => {
  beforeEach(async () => {
    const storage = createMockStorage()
    vi.stubGlobal('localStorage', createLocalStorageMock(storage))
    const mod = await import('./local')
    loadStore = mod.loadStore
    saveStore = mod.saveStore
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns default store when localStorage is empty', () => {
    const store = loadStore()
    expect(store).toBeDefined()
    expect(typeof store.activeId).toBe('string')
    expect(store.datasets).toBeDefined()
    expect(typeof store.datasets).toBe('object')
    expect(Array.isArray(store.datasets)).toBe(false)
    // Default: one dataset named "Default", empty todates/tags
    const ids = Object.keys(store.datasets)
    expect(ids.length).toBe(1)
    const [id] = ids
    expect(store.activeId).toBe(id)
    const ds = store.datasets[id]
    expect(ds.name).toBe('Default')
    expect(ds.todates).toEqual({})
    expect(ds.tags).toEqual({})
    expect(ds.schoolStartDate).toBeNull()
  })

  it('returns stored store when key has valid JSON', () => {
    const stored: Store = {
      activeId: 'x',
      datasets: {
        x: {
          id: 'x',
          name: 'Work',
          todates: {},
          tags: {},
        },
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const store = loadStore()
    expect(store.activeId).toBe('x')
    expect(store.datasets.x).toBeDefined()
    expect(store.datasets.x.name).toBe('Work')
  })

  it('returns default store when key has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const store = loadStore()
    expect(store.activeId).toBeDefined()
    const ids = Object.keys(store.datasets)
    expect(ids.length).toBe(1)
    expect(store.datasets[ids[0]].name).toBe('Default')
  })

  it('returns default store when stored shape is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeId: 'x' }))
    const store = loadStore()
    const ids = Object.keys(store.datasets)
    expect(ids.length).toBe(1)
    expect(store.datasets[ids[0]].name).toBe('Default')
  })
})

describe('saveStore', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    const storage = createMockStorage()
    vi.stubGlobal('localStorage', createLocalStorageMock(storage))
    const mod = await import('./local')
    loadStore = mod.loadStore
    saveStore = mod.saveStore
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('writes store to single key todate-store', () => {
    const store: Store = {
      activeId: 'a',
      datasets: {
        a: { id: 'a', name: 'Default', todates: {}, tags: {} },
      },
    }
    saveStore(store)
    vi.advanceTimersByTime(400)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.activeId).toBe('a')
    expect(parsed.datasets.a.name).toBe('Default')
  })

  it('overwrites previous value', () => {
    saveStore({
      activeId: 'first',
      datasets: {
        first: { id: 'first', name: 'First', todates: {}, tags: {} },
      },
    })
    saveStore({
      activeId: 'second',
      datasets: {
        second: { id: 'second', name: 'Second', todates: {}, tags: {} },
      },
    })
    vi.advanceTimersByTime(400)
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw!)
    expect(parsed.activeId).toBe('second')
    expect(parsed.datasets.second.name).toBe('Second')
  })
})

describe('saveStore debounce', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    const storage = createMockStorage()
    vi.stubGlobal('localStorage', createLocalStorageMock(storage))
    const mod = await import('./local')
    loadStore = mod.loadStore
    saveStore = mod.saveStore
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('debounces writes so rapid calls result in one write after delay (300–500ms)', () => {
    const store1: Store = {
      activeId: 'a',
      datasets: { a: { id: 'a', name: 'One', todates: {}, tags: {} } },
    }
    const store2: Store = {
      activeId: 'b',
      datasets: { b: { id: 'b', name: 'Two', todates: {}, tags: {} } },
    }
    const store3: Store = {
      activeId: 'c',
      datasets: { c: { id: 'c', name: 'Three', todates: {}, tags: {} } },
    }
    saveStore(store1)
    saveStore(store2)
    saveStore(store3)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(400)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.activeId).toBe('c')
    expect(parsed.datasets.c.name).toBe('Three')
  })

  it('writes again after debounce window when saveStore is called later', () => {
    const store1: Store = {
      activeId: 'a',
      datasets: { a: { id: 'a', name: 'One', todates: {}, tags: {} } },
    }
    saveStore(store1)
    vi.advanceTimersByTime(400)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).activeId).toBe('a')
    const store2: Store = {
      activeId: 'b',
      datasets: { b: { id: 'b', name: 'Two', todates: {}, tags: {} } },
    }
    saveStore(store2)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).activeId).toBe('a')
    vi.advanceTimersByTime(400)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).activeId).toBe('b')
  })
})
