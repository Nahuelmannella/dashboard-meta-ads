import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '../context/AccountContext'
import { useDateRange } from '../context/DateRangeContext'

export function useMetaApi<T>(endpoint: string, enabled: boolean = true) {
  const { selectedAccount } = useAccount()
  const { getQueryParams } = useDateRange()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedAccount || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const url = `/api/accounts/${selectedAccount.id}/${endpoint}?${getQueryParams()}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.error) throw new Error(json.error)

      setData(json.data ?? json.insights ?? json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount?.id, endpoint, getQueryParams(), enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
