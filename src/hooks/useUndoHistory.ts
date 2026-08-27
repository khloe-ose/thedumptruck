import { useCallback, useState } from 'react'

export function useUndoHistory<T>(limit = 30) {
  const [past, setPast] = useState<T[]>([])

  const push = useCallback((snapshot: T) => {
    setPast((current) => [...current.slice(-(limit - 1)), snapshot])
  }, [limit])

  const undo = useCallback((): T | undefined => {
    const previous = past.at(-1)
    if (previous) setPast((current) => current.slice(0, -1))
    return previous
  }, [past])

  const clear = useCallback(() => setPast([]), [])

  return { canUndo: past.length > 0, push, undo, clear }
}
