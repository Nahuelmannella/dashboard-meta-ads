import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useAccount } from './AccountContext'
import type { TabLevel } from '../types/meta'

type ExclusionMap = Record<TabLevel, Set<string>>

interface IncludedContextValue {
  isIncluded: (level: TabLevel, id: string) => boolean
  toggle: (level: TabLevel, id: string) => void
  setBulk: (level: TabLevel, ids: string[], include: boolean) => void
  excludedCount: (level: TabLevel) => number
  hasExclusions: (level: TabLevel) => boolean
  excludedIds: (level: TabLevel) => Set<string>
}

const IncludedContext = createContext<IncludedContextValue | null>(null)

const storageKey = (accountId: string, level: TabLevel) => `included:${accountId}:${level}`

function loadExclusions(accountId: string): ExclusionMap {
  const result: ExclusionMap = { campaigns: new Set(), adsets: new Set(), ads: new Set() }
  if (!accountId) return result
  for (const level of ['campaigns', 'adsets', 'ads'] as TabLevel[]) {
    try {
      const raw = localStorage.getItem(storageKey(accountId, level))
      if (raw) result[level] = new Set(JSON.parse(raw))
    } catch { /* ignore */ }
  }
  return result
}

export function IncludedProvider({ children }: { children: ReactNode }) {
  const { selectedAccount } = useAccount()
  const accountId = selectedAccount?.id || ''
  const [excluded, setExcluded] = useState<ExclusionMap>(() => loadExclusions(accountId))

  useEffect(() => {
    setExcluded(loadExclusions(accountId))
  }, [accountId])

  const persist = useCallback((level: TabLevel, set: Set<string>) => {
    if (!accountId) return
    localStorage.setItem(storageKey(accountId, level), JSON.stringify([...set]))
  }, [accountId])

  const toggle = useCallback((level: TabLevel, id: string) => {
    setExcluded(prev => {
      const next = { ...prev, [level]: new Set(prev[level]) }
      if (next[level].has(id)) next[level].delete(id)
      else next[level].add(id)
      persist(level, next[level])
      return next
    })
  }, [persist])

  const setBulk = useCallback((level: TabLevel, ids: string[], include: boolean) => {
    setExcluded(prev => {
      const set = new Set(prev[level])
      if (include) ids.forEach(id => set.delete(id))
      else ids.forEach(id => set.add(id))
      persist(level, set)
      return { ...prev, [level]: set }
    })
  }, [persist])

  const value = useMemo<IncludedContextValue>(() => ({
    isIncluded: (level, id) => !excluded[level].has(id),
    toggle,
    setBulk,
    excludedCount: (level) => excluded[level].size,
    hasExclusions: (level) => excluded[level].size > 0,
    excludedIds: (level) => excluded[level],
  }), [excluded, toggle, setBulk])

  return <IncludedContext.Provider value={value}>{children}</IncludedContext.Provider>
}

export function useIncluded() {
  const ctx = useContext(IncludedContext)
  if (!ctx) throw new Error('useIncluded must be used within IncludedProvider')
  return ctx
}
