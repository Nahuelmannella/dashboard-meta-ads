export interface AdAccount {
  id: string
  name: string
  account_id: string
  account_status: number
  currency: string
  timezone_name: string
  balance: string
  amount_spent: string
}

export interface MetaAction {
  action_type: string
  value: string
}

export interface InsightRow {
  campaign_name?: string
  campaign_id?: string
  adset_name?: string
  adset_id?: string
  ad_name?: string
  ad_id?: string
  spend: string
  impressions: string
  reach: string
  frequency: string
  clicks: string
  ctr: string
  cpc: string
  cpm: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
  cost_per_action_type?: MetaAction[]
  purchase_roas?: MetaAction[]
  quality_ranking?: string
  engagement_rate_ranking?: string
  conversion_rate_ranking?: string
  // Metadata enriquecido desde el backend (Graph API campaigns/adsets edges)
  campaign_objective?: string         // e.g. "OUTCOME_SALES", "CONVERSIONS"
  adset_optimization_goal?: string    // e.g. "OFFSITE_CONVERSIONS", "CONVERSATIONS"
  adset_destination_type?: string     // e.g. "WEBSITE", "MESSENGER", "WHATSAPP"
}

export interface TimeseriesInsightRow extends InsightRow {
  date_start: string
  date_stop: string
}

export type TabLevel = 'campaigns' | 'adsets' | 'ads'

export interface DateRange {
  since: string
  until: string
}

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'this_month'
  | 'last_month'

export function extractAction(actions: MetaAction[] | undefined, actionType: string): number {
  if (!actions) return 0
  const found = actions.find((a) => a.action_type === actionType)
  return found ? parseFloat(found.value) : 0
}

export function extractPurchases(row: InsightRow): number {
  return (
    extractAction(row.actions, 'purchase') ||
    extractAction(row.actions, 'offsite_conversion.fb_pixel_purchase') ||
    extractAction(row.actions, 'omni_purchase')
  )
}

export function extractPurchaseValue(row: InsightRow): number {
  return (
    extractAction(row.action_values, 'purchase') ||
    extractAction(row.action_values, 'offsite_conversion.fb_pixel_purchase') ||
    extractAction(row.action_values, 'omni_purchase')
  )
}

export function extractCostPerPurchase(row: InsightRow): number {
  return (
    extractAction(row.cost_per_action_type, 'purchase') ||
    extractAction(row.cost_per_action_type, 'offsite_conversion.fb_pixel_purchase') ||
    extractAction(row.cost_per_action_type, 'omni_purchase')
 