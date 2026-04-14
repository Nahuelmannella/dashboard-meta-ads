import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount } from '../../context/AccountContext'
import { useDateRange } from '../../context/DateRangeContext'
import { useIncluded } from '../../context/IncludedContext'
import { MetricCard } from '../common/MetricCard'
import { SkeletonMetrics } from '../common/SkeletonLoader'
import type { InsightRow, TimeseriesInsightRow } from '../../types/meta'
import { extractPurchases, extractPurchaseValue } from '../../types/meta'

interface CampaignComparison {
  current: InsightRow[]
  previous: InsightRow[]
}

// Aggregate a set of insight rows into a single totals object.
// Derived metrics (ctr, cpc, cpm, frequency, roas) are recomputed from base sums,
// because averaging per-row ratios would be wrong.
function aggregate(rows: InsightRow[]) {
  let spend = 0, impressions = 0, reach = 0, clicks = 0, purchases = 0, purchaseValue = 0
  for (const r of rows) {
    spend += parseFloat(r.spend) || 0
    impressions += parseFloat(r.impressions) || 0
    reach += parseFloat(r.reach) || 0
    clicks += parseFloat(r.clicks) || 0
    purchases += extractPurchases(r)
    purchaseValue += extractPurchaseValue(r)
  }
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spend / clicks : 0
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
  const roas = spend > 0 ? purchaseValue / spend : 0
  return { spend, impressions, reach, clicks, ctr, cpc, cpm, purchases, roas }
}

export function MetricsBar() {
  const { selectedAccount } = useAccount()
  const { getQueryParams, compareMode } = useDateRange()
  const { excludedIds, hasExclusions } = useIncluded()
  const [data, setData] = useState<CampaignComparison | null>(null)
  const [timeseries, setTimeseries] = useState<TimeseriesInsightRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)
    try {
      const qp = getQueryParams()
      const [compRes, tsRes] = await Promise.all([
        fetch(`/api/accounts/${selectedAccount.id}/campaigns/comparison?${qp}&compare_mode=${compareMode}`),
        fetch(`/api/accounts/${selectedAccount.id}/campaigns/timeseries?${qp}`).catch(() => null),
      ])
      const compJson = await compRes.json()
      if (compJson.error) throw new Error(compJson.error)
      setData({ current: compJson.current || [], previous: compJson.previous || [] })

      if (tsRes && tsRes.ok) {
        try {
          const tsJson = await tsRes.json()
          setTimeseries(tsJson.data || [])
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount?.id, getQueryParams(), compareMode])

  useEffect(() => { fetchData() }, [fetchData])

  const excluded = excludedIds('campaigns')
  const hasExcl = hasExclusions('campaigns')

  const { curr, prev, sparklineTotals } = useMemo(() => {
    const emptyAgg = { spend: 0, impressions: 0, reach: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0, purchases: 0, roas: 0 }
    if (!data) return { curr: emptyAgg, prev: null as ReturnType<typeof aggregate> | null, sparklineTotals: [] as ReturnType<typeof aggregate>[] }

    const filterFn = (r: InsightRow) => !r.campaign_id || !excluded.has(r.campaign_id)
    const curr = aggregate(data.current.filter(filterFn))
    const prev = data.previous.length > 0 ? aggregate(data.previous.filter(filterFn)) : null

    // Group timeseries by date, aggregate per day (only included campaigns)
    const byDate = new Map<string, InsightRow[]>()
    for (const r of timeseries) {
      if (!filterFn(r)) continue
      const d = r.date_start
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(r)
    }
    const dates = [...byDate.keys()].sort()
    const sparklineTotals = dates.map(d => aggregate(byDate.get(d)!))
    return { curr, prev, sparklineTotals }
  }, [data, timeseries, excluded])

  if (loading && !data) return <SkeletonMetrics />
  if (error) return <div className="error-banner">Error cargando metricas: {error}</div>
  if (!data) return null

  const currency = selectedAccount?.currency || 'MXN'
  const trendLabel = compareMode === 'year' ? 'vs ano ant.' : 'vs anterior'

  const spSpend = sparklineTotals.map(r => r.spend)
  const spImpressions = sparklineTotals.map(r => r.impressions)
  const spClicks = sparklineTotals.map(r => r.clicks)
  const spCtr = sparklineTotals.map(r => r.ctr)
  const spCpc = sparklineTotals.map(r => r.cpc)
  const spCpm = sparklineTotals.map(r => r.cpm)
  const spPurchases = sparklineTotals.map(r => r.purchases)
  const spRoas = sparklineTotals.map(r => r.roas)

  return (
    <>
      {hasExcl && (
        <div style={{ fontSize: 12, color: 'var(--accent-yellow)', padding: '4px 16px', marginTop: 4 }}>
          Totales calculados excluyendo {excluded.size} campaña{excluded.size === 1 ? '' : 's'}.
        </div>
      )}
      <div className="metrics-bar">
        <MetricCard label="Gasto Total" value={curr.spend} format="currency" currency={currency} sensitive previousValue={prev?.spend ?? null} trendLabel={trendLabel} sparklineData={spSpend} />
        <MetricCard label="Impresiones" value={curr.impressions} format="compact" previousValue={prev?.impressions ?? null} trendLabel={trendLabel} sparklineData={spImpressions} />
        <MetricCard label="Clicks" value={curr.clicks} format="compact" previousValue={prev?.clicks ?? null} trendLabel={trendLabel} sparklineData={spClicks} />
        <MetricCard label="CTR" value={curr.ctr} format="percent" previousValue={prev?.ctr ?? null} trendLabel={trendLabel} sparklineData={spCtr} />
        <MetricCard label="CPC" value={curr.cpc} format="currency" currency={currency} sensitive previousValue={prev?.cpc ?? null} invertTrend trendLabel={trendLabel} sparklineData={spCpc} />
        <MetricCard label="CPM" value={curr.cpm} format="currency" currency={currency} sensitive previousValue={prev?.cpm ?? null} invertTrend trendLabel={trendLabel} sparklineData={spCpm} />
        <MetricCard label="Compras" value={curr.purchases} format="number" previousValue={prev?.purchases ?? null} trendLabel={trendLabel} sparklineData={spPurchases} />
        <MetricCard label="ROAS" value={curr.roas} format="roas" previousValue={prev?.roas ?? null} trendLabel={trendLabel} sparklineData={spRoas} />
      </div>
    </>
  )
}
