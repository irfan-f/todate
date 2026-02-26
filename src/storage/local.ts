import type { Store } from '../types'
import { isStore } from '../types'
import { randomUUID } from '../utils/id'

const STORAGE_KEY = 'todate-store'
const DEBOUNCE_MS = 400

function defaultStore(): Store {
  const id = randomUUID()
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
  }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null || raw === '') return defaultStore()
    const parsed: unknown = JSON.parse(raw)
    if (isStore(parsed)) return parsed
    return defaultStore()
  } catch {
    return defaultStore()
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null
let pendingStore: Store | null = null

function flushSave(): void {
  if (pendingStore === null) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingStore))
  pendingStore = null
  saveTimeout = null
}

export function saveStore(store: Store): void {
  pendingStore = store
  if (saveTimeout !== null) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(flushSave, DEBOUNCE_MS)
}
