const store = new Map()

const DEFAULTS = {
  ttlMs: 5 * 60 * 1000,
  maxSize: 50000,
}

export function get(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function set(key, value, ttlMs = DEFAULTS.ttlMs) {
  if (store.size >= DEFAULTS.maxSize) {
    const oldest = store.keys().next().value
    store.delete(oldest)
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function clear() { store.clear() }
export function size() { return store.size }
