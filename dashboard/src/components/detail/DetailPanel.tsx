import { useState, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useSelection } from '@/context/SelectionContext'
import { useAccount } from '@/context/AccountContext'
import { useTimeseries } from '@/hooks/useTimeseries'
import { getMetricConfig, METRIC_OPTIONS } from '@/config/metrics'
import { MetricSelector } from './MetricSelector'
import { TimeseriesChart } from './TimeseriesChart'
import { SummaryKPIs } from './SummaryKPIs'
import { auditSingleEntity } from '@/lib/auditEngine'
import { useSensitiveData } from '@/context/SensitiveDataContext'
import type { AuditRecommendation } from '@/types/audit'

const LEVEL_LABELS: Record<string, string> = {
  campaigns: 'Campana',
  adsets: 'Conjunto de Anuncios',
  ads: 'Anuncio',
}

const SEVERITY_CONFIG = {
  critical: { icon: '🔴', label: 'CRÍTICO', className: 'audit-critical' },
  warning: { icon: '⚠️', label: 'ALERTA', className: 'audit-warning' },
  opportunity: { icon: '🟢', label: 'OPORTUNIDAD', className: 'audit-opportunity' },
  info: { icon: 'ℹ️', label: 'INFO', className: 'audit-info' },
}

export function DetailPanel() {
  const { selectedEntity, clearSelection } = useSelection()
  const { selectedAccount } = useAccount()
  const [selectedMetric, setSelectedMetric] = useState('spend')
  const [secondaryMetric, setSecondaryMetric] = useState<string>('')

  const { data: timeseriesData, loading, error } = useTimeseries(
    selectedEntity?.level || 'campaigns',
    selectedEntity?.id || '',
    !!selectedEntity
  )

  const currency = selectedAccount?.currency || 'MXN'
  const metricConfig = getMetricConfig(selectedMetric)
  const secondaryConfig = secondaryMetric ? getMetricConfig(secondaryMetric) : null
  const { isHidden } = useSensitiveData()
  const blurClass = isHidden ? 'sensitive-hidden' : 'sensitive-visible'

  const entityLevel = selectedEntity?.level === 'campaigns' ? 'campaign'
    : selectedEntity?.level === 'adsets' ? 'adset' : 'ad'

  const diagnostics: AuditRecommendation[] = useMemo(() => {
    if (!selectedEntity?.row) return []
    return auditSingleEntity(selectedEntity.row, entityLevel)
  }, [selectedEntity?.row, entityLevel])

  return (
    <Sheet open={!!selectedEntity} onOpenChange={(open) => { if (!open) clearSelection() }}>
      <SheetContent
        side="right"
        style={{
          width: '620px',
          maxWidth: '92vw',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {selectedEntity && (
          <>
            <SheetHeader>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--accent-blue)',
                    background: 'rgba(79, 143, 247, 0.12)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {LEVEL_LABELS[selectedEntity.level]}
                </span>
              </div>
              <SheetTitle>{selectedEntity.name}</SheetTitle>
              <SheetDescription>ID: {selectedEntity.id}</SheetDescription>
            </SheetHeader>

            <div style={{ borderBottom: '1px solid var(--border)', margin: '0 0 16px' }} />

            <SummaryKPIs row={selectedEntity.row} currency={currency} />

            {/* Diagnostics section */}
            {diagnostics.length > 0 && (
              <>
                <div style={{ borderBottom: '1px solid var(--border)', margin: '0 0 16px' }} />
                <div className="detail-diagnostics">
                  <div className="detail-diagnostics-title">
                    <span>🧠</span>
                    <span>Diagnóstico</span>
                  </div>
                  {diagnostics.map((rec) => {
                    const config = SEVERITY_CONFIG[rec.severity]
                    return (
                      <div key={rec.id} className={`detail-diagnostic-card ${config.className}`}>
                        <div className="detail-diagnostic-header">
                          <span>{config.icon}</span>
                          <span className="detail-diagnostic-label">{rec.title}</span>
                        </div>
                        <div className={`detail-diagnostic-desc ${blurClass}`}>{rec.description}</div>
                        <div className="detail-diagnostic-action">→ {rec.action}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ borderBottom: '1px solid var(--border)', margin: '0 0 16px' }} />

            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
                Tendencia temporal
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Metrica principal</div>
                  <MetricSelector value={selectedMetric} onChange={setSelectedMetric} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Comparar con</div>
                  <select
                    className="select"
                    style={{ width: '100%', minWidth: 0, fontSize: 13, padding: '7px 28px 7px 10px' }}
                    value={secondaryMetric}
                    onChange={(e) => setSecondaryMetric(e.target.value)}
                  >
                    <option value="">Ninguna</option>
                    {METRIC_OPTIONS.filter(m => m.key !== selectedMetric).map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Cargando datos...
                </div>
              </div>
            )}

            {error && (
              <div className="error-banner">Error: {error}</div>
            )}

            {!loading && !error && (
              <div style={{ flex: 1 }}>
                <TimeseriesChart
                  data={timeseriesData}
                  metric={metricConfig}
                  secondaryMetric={secondaryConfig}
                  currency={currency}
                />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
