import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '../context/AccountContext'
import { useDateRange } from '../context/DateRangeContext'
import type { TabLevel, TimeseriesInsightRow } from '../types/meta'

export function useTimeseries(level: TabLevel, entityId: string, enabled: boolean) {
  const { selectedAccount } = useAccount()
  const { getQueryParams } = useDateRange()
  const [data, setData] = useState<TimeseriesInsightRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedAccount || !enabled || !entityId) return

    setLoading(true)
    setError(null)

    try {
      const url = `/api/accounts/${selectedAccount.id}/${level}/${entityId}/timeseries?${getQueryParams()}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.error) throw new Error(json.error)

      const rows = (json.data || []) as TimeseriesInsightRow[]
      rows.sort((a, b) => a.date_start.localeCompare(b.date_start))
      setData(rows)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount?.id, level, entityId, getQueryParams(), enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error }
}
