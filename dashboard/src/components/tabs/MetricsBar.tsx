import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '../../context/AccountContext'
import { useDateRange } from '../../context/DateRangeContext'
import { MetricCard } from '../common/MetricCard'
import { SkeletonMetrics } from '../common/SkeletonLoader'
import type { InsightRow, TimeseriesInsightRow } from '../../types/meta'
import { extractPurchases, extractRoas } from '../../types/meta'

interface ComparisonResponse {
  current: InsightRow | null
  previous: InsightRow | null
}

export function MetricsBar() {
  const { selectedAccount } = useAccount()
  const { getQueryParams, compareMode } = useDateRange()
  const [data, setData] = useState<ComparisonResponse | null>(null)
  const [sparklines, setSparklines] = useState<TimeseriesInsightRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)
    try {
      const qp = getQueryParams()
      const [compRes, tsRes] = await Promise.all([
        fetch(`/api/accounts/${selectedAccount.id}/insights/comparison?${qp}&compare_mode=${compareMode}`),
        fetch(`/api/accounts/${selectedAccount.id}/insights/timeseries?${qp}`).catch(() => null),
      ])
      const compJson = await compRes.json()
      if (compJson.error) throw new Error(compJson.error)
      setData(compJson)

      // Sparklines are optional — don't fail if the endpoint is unavailable
      if (tsRes && tsRes.ok) {
        try {
          const tsJson = await tsRes.json()
          setSparklines(tsJson.data || [])
        } catch { /* ignore parse errors */ }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount?.id, getQueryParams(), compareMode])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <SkeletonMetrics />
  if (error) return <div className="error-banner">Error cargando metricas: {error}</div>
  if (!data?.current) return null

  const curr = data.current
  const prev = data.previous
  const currency = selectedAccount?.currency || 'MXN'

  const spend = parseFloat(curr.spend) || 0
  const impressions = parseFloat(curr.impressions) || 0
  const clicks = parseFloat(curr.clicks) || 0
  const ctr = parseFloat(curr.ctr) || 0
  const cpc = parseFloat(curr.cpc) || 0
  const cpm = parseFloat(curr.cpm) || 0
  const purchases = extractPurchases(curr)
  const roas = extractRoas(curr)

  const pSpend = prev ? parseFloat(prev.spend) || 0 : null
  const pImpressions = prev ? parseFloat(prev.impressions) || 0 : null
  const pClicks = prev ? parseFloat(prev.clicks) || 0 : null
  const pCtr = prev ? parseFloat(prev.ctr) || 0 : null
  const pCpc = prev ? parseFloat(prev.cpc) || 0 : null
  const pCpm = prev ? parseFloat(prev.cpm) || 0 : null
  const pPurchases = prev ? extractPurchases(prev) : null
  const pRoas = prev ? extractRoas(prev) : null

  const trendLabel = compareMode === 'year' ? 'vs ano ant.' : 'vs anterior'

  // Extract sparkline data arrays from timeseries
  const spSpend = sparklines.map(r => parseFloat(r.spend) || 0)
  const spImpressions = sparklines.map(r => parseFloat(r.impressions) || 0)
  const spClicks = sparklines.map(r => parseFloat(r.clicks) || 0)
  const spCtr = sparklines.map(r => parseFloat(r.ctr) || 0)
  const spCpc = sparklines.map(r => parseFloat(r.cpc) || 0)
  const spCpm = sparklines.map(r => parseFloat(r.cpm) || 0)
  const spPurchases = sparklines.map(r => extractPurchases(r))
  const spRoas = sparklines.map(r => extractRoas(r))

  return (
    <div className="metrics-bar">
      <MetricCard label="Gasto Total" value={spend} format="currency" currency={currency} sensitive previousValue={pSpend} trendLabel={trendLabel} sparklineData={spSpend} />
      <MetricCard label="Impresiones" value={impressions} format="compact" previousValue={pImpressions} trendLabel={trendLabel} sparklineData={spImpressions} />
      <MetricCard label="Clicks" value={clicks} format="compact" previousValue={pClicks} trendLabel={trendLabel} sparklineData={spClicks} />
      <MetricCard label="CTR" value={ctr} format="percent" previousValue={pCtr} trendLabel={trendLabel} sparklineData={spCtr} />
      <MetricCard label="CPC" value={cpc} format="currency" currency={currency} sensitive previousValue={pCpc} invertTrend trendLabel={trendLabel} sparklineData={spCpc} />
      <MetricCard label="CPM" value={cpm} format="currency" currency={currency} sensitive previousValue={pCpm} invertTrend trendLabel={trendLabel} sparklineData={spCpm} />
      <MetricCard label="Compras" value={purchases} format="number" previousValue={pPurchases} trendLabel={trendLabel} sparklineData={spPurchases} />
      <MetricCard label="ROAS" value={roas} format="roas" previousValue={pRoas} trendLabel={trendLabel} sparklineData={spRoas} />
    </div>
  )
}
