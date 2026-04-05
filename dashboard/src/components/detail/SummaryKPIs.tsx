import type { InsightRow } from '@/types/meta'
import {
  extractRoas,
  extractAddToCart,
  extractInitiateCheckout,
  getPrimaryResult,
} from '@/types/meta'
import { SensitiveNumber } from '@/components/common/SensitiveNumber'

interface SummaryKPIsProps {
  row: InsightRow
  currency: string
}

interface KPIItem {
  label: string
  value: React.ReactNode
  color?: string
}

export function SummaryKPIs({ row, currency }: SummaryKPIsProps) {
  const ctr = parseFloat(row.ctr) || 0
  const primary = getPrimaryResult(row)
  const isSales = primary.objective === 'sales'

  // Base KPIs that always make sense
  const kpis: KPIItem[] = [
    {
      label: 'Gasto',
      value: <SensitiveNumber value={parseFloat(row.spend) || 0} format="currency" currency={currency} />,
    },
    {
      label: 'Impresiones',
      value: (parseFloat(row.impressions) || 0).toLocaleString('es-MX'),
    },
    {
      label: 'Clicks',
      value: (parseFloat(row.clicks) || 0).toLocaleString('es-MX'),
    },
    {
      label: 'CTR',
      value: `${ctr.toFixed(2)}%`,
      color: ctr >= 2 ? 'var(--accent-green)' : ctr < 1 ? 'var(--accent-red)' : undefined,
    },
    {
      label: 'CPC',
      value: <SensitiveNumber value={parseFloat(row.cpc) || 0} format="currency" currency={currency} />,
    },
    {
      label: 'CPM',
      value: <SensitiveNumber value={parseFloat(row.cpm) || 0} format="currency" currency={currency} />,
    },
  ]

  if (isSales) {
    // Sales funnel: Add to cart → Purchases → ROAS
    const purchases = primary.value
    const cpp = primary.cost
    const roas = extractRoas(row)
    const addToCart = extractAddToCart(row)
    const initiateCheckout = extractInitiateCheckout(row)

    kpis.push(
      {
        label: 'Añadidos al carrito',
        value: addToCart ? addToCart.toLocaleString('es-MX') : '—',
        color: addToCart > 0 ? 'var(--accent-blue)' : undefined,
      },
      {
        label: 'Checkout iniciado',
        value: initiateCheckout ? initiateCheckout.toLocaleString('es-MX') : '—',
        color: initiateCheckout > 0 ? 'var(--accent-blue)' : undefined,
      },
      {
        label: 'Compras',
        value: purchases || '—',
        color: purchases > 0 ? 'var(--accent-green)' : undefined,
      },
      {
        label: 'Costo/Compra',
        value: cpp ? <SensitiveNumber value={cpp} format="currency" currency={currency} /> : '—',
      },
      {
        label: 'ROAS',
        value: roas ? `${roas.toFixed(2)}x` : '—',
        color:
          roas >= 3 ? 'var(--accent-green)'
          : roas > 0 && roas < 1 ? 'var(--accent-red)'
          : roas > 0 ? 'var(--accent-yellow)'
          : undefined,
      },
    )
  } else