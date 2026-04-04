import { useCallback, useMemo, useState } from 'react'

export default function useLocalStorage(key) {
  const storageKey = useMemo(() => key, [key])
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const loadRaw = useCallback(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw)
  }, [storageKey])

  const save = useCallback(
    (value) => {
      const payload = { value, savedAt: new Date().toISOString() }
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
      setLastSavedAt(payload.savedAt)
      return payload.savedAt
    },
    [storageKey],
  )

  const load = useCallback(() => {
    const payload = loadRaw()
    if (!payload) return null
    if (payload.savedAt) setLastSavedAt(payload.savedAt)
    return payload.value ?? null
  }, [loadRaw])

  const clear = useCallback(() => {
    window.localStorage.removeItem(storageKey)
    setLastSavedAt(null)
  }, [storageKey])

  return { save, load, clear, lastSavedAt }
}
