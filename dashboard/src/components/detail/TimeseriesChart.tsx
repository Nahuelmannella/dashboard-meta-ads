import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ComposedChart,
} from 'recharts'
import type { TimeseriesInsightRow } from '@/types/meta'
import type { MetricConfig } from '@/config/metrics'

interface TimeseriesChartProps {
  data: TimeseriesInsightRow[]
  metric: MetricConfig
  secondaryMetric?: MetricConfig | null
  currency: string
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function CustomTooltip(props: any) {
  const { active, payload, metric, secondaryMetric, currency } = props
  if (!active || !payload?.length) return null
  const item = payload[0]
  const raw = (item as any).payload?.dateRaw
  const dateFormatted = raw ? new Date(raw + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 12 }}>
        {dateFormatted}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: secondaryMetric ? 4 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: metric.color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {metric.label}: {metric.format((item as any).payload?.value ?? 0, currency)}
        </span>
      </div>
      {secondaryMetric && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: secondaryMetric.color, display: 'inline-block', flexShrink: 0, border: '1px dashed var(--text-muted)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {secondaryMetric.label}: {secondaryMetric.format((item as any).payload?.value2 ?? 0, currency)}
          </span>
        </div>
      )}
    </div>
  )
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (value % 1 !== 0) return value.toFixed(2)
  return String(value)
}

export function TimeseriesChart({ data, metric, secondaryMetric, currency }: TimeseriesChartProps) {
  const chartData = useMemo(() => data.map((row) => ({
    date: formatDateLabel(row.date_start),
    dateRaw: row.date_start,
    value: metric.getValue(row),
    ...(secondaryMetric ? { value2: secondaryMetric.getValue(row) } : {}),
  })), [data, metric, secondaryMetric])

  const { maxVal, minVal, avgVal } = useMemo(() => {
    if (!chartData.length) return { maxVal: 0, minVal: 0, avgVal: 0 }
    const values = chartData.map(d => d.value)
    return {
      maxVal: Math.max(...values),
      minVal: Math.min(...values),
      avgVal: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        No hay datos para graficar
      </div>
    )
  }

  // Show min/max/avg annotations
  const annotations = (
    <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
      <span>Min: <b style={{ color: 'var(--text-primary)' }}>{metric.format(minVal, currency)}</b></span>
      <span>Prom: <b style={{ color: 'var(--text-primary)' }}>{metric.format(avgVal, currency)}</b></span>
      <span>Max: <b style={{ color: 'var(--text-primary)' }}>{metric.format(maxVal, currency)}</b></span>
    </div>
  )

  if (secondaryMetric) {
    return (
      <>
        {annotations}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={formatYAxis} tickLine={false} axisLine={false} width={50} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={formatYAxis} tickLine={false} axisLine={false} width={50} />
            <Tooltip content={<CustomTooltip metric={metric} secondaryMetric={secondaryMetric} currency={currency} />} cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }} />
            <Area yAxisId="left" type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} fill="url(#colorMetric)" dot={{ r: 3, fill: metric.color, stroke: 'var(--bg-secondary)', strokeWidth: 2 }} activeDot={{ r: 5, fill: metric.color, stroke: 'var(--bg-secondary)', strokeWidth: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="value2" stroke={secondaryMetric.color} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: secondaryMetric.color, stroke: 'var(--bg-secondary)', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </>
    )
  }

  return (
    <>
      {annotations}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={formatYAxis} tickLine={false} axisLine={false} width={50} />
          <Tooltip content={<CustomTooltip metric={metric} currency={currency} />} cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }} />
          <ReferenceLine y={avgVal} stroke="var(--text-muted)" strokeDasharray="3 3" strokeWidth={1} />
          <Area type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} fill="url(#colorMetric)" dot={{ r: 3, fill: metric.color, stroke: 'var(--bg-secondary)', strokeWidth: 2 }} activeDot={{ r: 5, fill: metric.color, stroke: 'var(--bg-secondary)', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </>
  )
}
