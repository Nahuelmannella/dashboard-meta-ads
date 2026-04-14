import { createHmac } from 'crypto'
import { META_ACCESS_TOKEN, META_APP_SECRET, META_BASE_URL } from './config.ts'

function generateAppSecretProof(): string {
  return createHmac('sha256', META_APP_SECRET).update(META_ACCESS_TOKEN).digest('hex')
}

async function metaFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${META_BASE_URL}${endpoint}`)
  url.searchParams.set('access_token', META_ACCESS_TOKEN)
  url.searchParams.set('appsecret_proof', generateAppSecretProof())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message} (code: ${data.error.code})`)
  }

  return data
}

async function fetchAllPages(endpoint: string, params: Record<string, string> = {}): Promise<any[]> {
  const firstPage = await metaFetch(endpoint, params)
  let results = firstPage.data || []
  let nextUrl = firstPage.paging?.next

  while (nextUrl) {
    const res = await fetch(nextUrl)
    const data = await res.json()
    if (data.error) break
    results = results.concat(data.data || [])
    nextUrl = data.paging?.next
  }

  return results
}

export async function getAdAccounts() {
  return fetchAllPages('/me/adaccounts', {
    fields: 'name,account_id,account_status,currency,timezone_name,balance,amount_spent',
  })
}

export async function getAccountInsights(accountId: string, timeRange?: string, datePreset?: string) {
  const params: Record<string, string> = {
    fields: [
      'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
    ].join(','),
    level: 'account',
  }

  if (timeRange) {
    params.time_range = timeRange
  } else if (datePreset) {
    params.date_preset = datePreset
  } else {
    params.date_preset = 'last_7d'
  }

  const data = await metaFetch(`/${accountId}/insights`, params)
  return data.data?.[0] || null
}

// ---- Metadata enrichment (objective / optimization_goal / destination_type) ----

type AdSetMeta = { optimization_goal?: string; destination_type?: string; campaign_id?: string }

async function getCampaignObjectives(accountId: string): Promise<Map<string, string>> {
  const data = await fetchAllPages(`/${accountId}/campaigns`, {
    fields: 'id,objective',
    limit: '200',
  })
  const map = new Map<string, string>()
  for (const c of data) if (c.id && c.objective) map.set(c.id, c.objective)
  return map
}

async function getAdSetMeta(accountId: string): Promise<Map<string, AdSetMeta>> {
  const data = await fetchAllPages(`/${accountId}/adsets`, {
    fields: 'id,campaign_id,optimization_goal,destination_type',
    limit: '200',
  })
  const map = new Map<string, AdSetMeta>()
  for (const a of data) {
    if (!a.id) continue
    map.set(a.id, {
      optimization_goal: a.optimization_goal,
      destination_type: a.destination_type,
      campaign_id: a.campaign_id,
    })
  }
  return map
}

export async function getCampaignInsights(accountId: string, timeRange?: string, datePreset?: string) {
  const params: Record<string, string> = {
    fields: [
      'campaign_name', 'campaign_id',
      'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
    ].join(','),
    level: 'campaign',
    limit: '100',
    filtering: JSON.stringify([{ field: 'campaign.effective_status', operator: 'IN', value: ['ACTIVE'] }]),
  }

  if (timeRange) {
    params.time_range = timeRange
  } else if (datePreset) {
    params.date_preset = datePreset
  } else {
    params.date_preset = 'last_7d'
  }

  const [rows, objMap] = await Promise.all([
    fetchAllPages(`/${accountId}/insights`, params),
    getCampaignObjectives(accountId).catch(() => new Map<string, string>()),
  ])
  return rows.map((r) => ({
    ...r,
    campaign_objective: r.campaign_id ? objMap.get(r.campaign_id) : undefined,
  }))
}

export async function getAdSetInsights(accountId: string, timeRange?: string, datePreset?: string) {
  const params: Record<string, string> = {
    fields: [
      'adset_name', 'adset_id', 'campaign_name', 'campaign_id',
      'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
    ].join(','),
    level: 'adset',
    limit: '100',
    filtering: JSON.stringify([{ field: 'adset.effective_status', operator: 'IN', value: ['ACTIVE'] }]),
  }

  if (timeRange) {
    params.time_range = timeRange
  } else if (datePreset) {
    params.date_preset = datePreset
  } else {
    params.date_preset = 'last_7d'
  }

  const [rows, objMap, adsetMap] = await Promise.all([
    fetchAllPages(`/${accountId}/insights`, params),
    getCampaignObjectives(accountId).catch(() => new Map<string, string>()),
    getAdSetMeta(accountId).catch(() => new Map<string, AdSetMeta>()),
  ])
  return rows.map((r) => {
    const meta = r.adset_id ? adsetMap.get(r.adset_id) : undefined
    const campaignId = meta?.campaign_id || r.campaign_id
    return {
      ...r,
      campaign_objective: campaignId ? objMap.get(campaignId) : undefined,
      adset_optimization_goal: meta?.optimization_goal,
      adset_destination_type: meta?.destination_type,
    }
  })
}

export async function getAdInsights(accountId: string, timeRange?: string, datePreset?: string) {
  const params: Record<string, string> = {
    fields: [
      'ad_name', 'ad_id', 'adset_name', 'adset_id', 'campaign_name', 'campaign_id',
      'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
      'quality_ranking', 'engagement_rate_ranking', 'conversion_rate_ranking',
    ].join(','),
    level: 'ad',
    limit: '100',
    filtering: JSON.stringify([{ field: 'ad.effective_status', operator: 'IN', value: ['ACTIVE'] }]),
  }

  if (timeRange) {
    params.time_range = timeRange
  } else if (datePreset) {
    params.date_preset = datePreset
  } else {
    params.date_preset = 'last_7d'
  }

  const [rows, objMap, adsetMap] = await Promise.all([
    fetchAllPages(`/${accountId}/insights`, params),
    getCampaignObjectives(accountId).catch(() => new Map<string, string>()),
    getAdSetMeta(accountId).catch(() => new Map<string, AdSetMeta>()),
  ])
  return rows.map((r) => {
    const meta = r.adset_id ? adsetMap.get(r.adset_id) : undefined
    const campaignId = meta?.campaign_id || r.campaign_id
    return {
      ...r,
      campaign_objective: campaignId ? objMap.get(campaignId) : undefined,
      adset_optimization_goal: meta?.optimization_goal,
      adset_destination_type: meta?.destination_type,
    }
  })
}

export async function getEntityTimeseries(
  accountId: string,
  level: 'campaign' | 'adset' | 'ad',
  filterField: string,
  entityId: string,
  timeRange?: string,
  datePreset?: string
) {
  const params: Record<string, string> = {
    fields: [
      'date_start', 'date_stop',
      'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
    ].join(','),
    level,
    time_increment: '1',
    limit: '500',
    filtering: JSON.stringify([{ field: filterField, operator: 'EQUAL', value: entityId }]),
  }

  if (timeRange) {
    params.time_range = timeRange
  } else if (datePreset) {
    params.date_preset = datePreset
  } else {
    params.date_preset = 'last_7d'
  }

  const data = await metaFetch(`/${accountId}/insights`, params)
  return data.data || []
}