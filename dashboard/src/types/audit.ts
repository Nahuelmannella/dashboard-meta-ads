export type AuditSeverity = 'critical' | 'warning' | 'opportunity' | 'info'

export interface AuditRecommendation {
  id: string
  severity: AuditSeverity
  entityName: string
  entityLevel: 'campaign' | 'adset' | 'ad'
  title: string
  description: string
  action: string
  metric?: string
  metricValue?: number
}

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical'

export interface HealthSummary {
  excellent: number
  good: number
  warning: number
  critical: number
  total: number
}

// Thresholds based on LATAM e-commerce benchmarks (Mexico/MXN)
export const AUDIT_THRESHOLDS = {
  // ROAS
  ROAS_CRITICAL: 1.0,       // Losing money (below break-even)
  ROAS_WARNING: 2.0,        // Barely profitable after margins
  ROAS_GOOD: 3.0,           // Healthy return
  ROAS_EXCELLENT: 4.0,      // Scale opportunity

  // CTR (Meta Ads average in LATAM: ~1.0-1.5%)
  CTR_CRITICAL: 0.5,        // Very low engagement
  CTR_LOW: 1.0,             // Below average
  CTR_GOOD: 2.0,            // Above average
  CTR_EXCELLENT: 3.5,       // Exceptional

  // Frequency
  FREQUENCY_WARNING: 3.0,   // Starting to fatigue
  FREQUENCY_CRITICAL: 4.5,  // Audience fatigue

  // CPM (MXN — Mexican market average: $40-$70)
  CPM_HIGH: 80,             // Above market average
  CPM_VERY_HIGH: 120,       // Very expensive delivery

  // CPC multiplier (compared to account avg)
  CPC_HIGH_MULTIPLIER: 2.0, // 2x the account average

  // Spend without conversions
  SPEND_NO_CONVERSION_WARNING: 300,  // ~$17 USD
  SPEND_NO_CONVERSION_CRITICAL: 800, // ~$45 USD

  // Budget concentration
  BUDGET_CONCENTRATION_WARNING: 0.5, // 50% of total spend
  BUDGET_CONCENTRATION_CRITICAL: 0.7, // 70% of total spend

  // Scale opportunity: min spend to consider
  SCALE_MIN_SPEND: 100,
} as const
