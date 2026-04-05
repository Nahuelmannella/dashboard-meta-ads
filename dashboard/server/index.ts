import express from 'express'
import cors from 'cors'
import {
  getAdAccounts,
  getAccountInsights,
  getCampaignInsights,
  getAdSetInsights,
  getAdInsights,
  getEntityTimeseries,
} from './meta-api.ts'

const app = express()
app.use(cors())
app.use(express.json())

function parseDateParams(query: any): { timeRange?: string; datePreset?: string } {
  if (query.since && query.until) {
    return { timeRange: JSON.stringify({ since: query.since, until: query.until }) }
  }
  return { datePreset: query.date_preset || 'last_7d' }
}

app.get('/api/accounts', async (_req, res) => {
  try {
    const accounts = await getAdAccounts()
    res.json({ accounts })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/accounts/:id/insights', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const insights = await getAccountInsights(req.params.id, timeRange, datePreset)
    res.json({ insights })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/accounts/:id/campaigns', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const data = await getCampaignInsights(req.params.id, timeRange, datePreset)
    res.json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/accounts/:id/adsets', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const data = await getAdSetInsights(req.params.id, timeRange, datePreset)
    res.json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/accounts/:id/ads', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const data = await getAdInsights(req.params.id, timeRange, datePreset)
    res.json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Presets → number of days for previous period calculation
const PRESET_DAYS: Record<string, number> = {
  today: 1, yesterday: 1, last_7d: 7, last_14d: 14, last_30d: 30, this_month: 30, last_month: 30,
}

function getComparisonRange(query: any, mode: string): { timeRange: string } | null {
  // Resolve current period dates
  let sinceDate: Date, untilDate: Date
  if (query.since && query.until) {
    sinceDate = new Date(query.since)
    untilDate = new Date(query.until)
  } else {
    const preset = query.date_preset || 'last_7d'
    const days = PRESET_DAYS[preset] || 7
    untilDate = new Date()
    untilDate.setHours(0, 0, 0, 0)
    sinceDate = new Date(untilDate.getTime() - (days - 1) * 86400000)
  }

  const days = Math.round((untilDate.getTime() - sinceDate.getTime()) / 86400000) + 1

  if (mode === 'year') {
    // Same dates, one year ago
    const prevSince = new Date(sinceDate)
    prevSince.setFullYear(prevSince.getFullYear() - 1)
    const prevUntil = new Date(untilDate)
    prevUntil.setFullYear(prevUntil.getFullYear() - 1)
    return { timeRange: JSON.stringify({ since: prevSince.toISOString().slice(0, 10), until: prevUntil.toISOString().slice(0, 10) }) }
  }

  // Default: previous period (same duration, immediately before)
  const prevUntil = new Date(sinceDate.getTime() - 86400000)
  const prevSince = new Date(prevUntil.getTime() - (days - 1) * 86400000)
  return { timeRange: JSON.stringify({ since: prevSince.toISOString().slice(0, 10), until: prevUntil.toISOString().slice(0, 10) }) }
}

app.get('/api/accounts/:id/insights/comparison', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const compareMode = (req.query.compare_mode as string) || 'previous'
    const current = await getAccountInsights(req.params.id, timeRange, datePreset)
    let previous = null
    if (compareMode !== 'none') {
      const prevRange = getComparisonRange(req.query, compareMode)
      if (prevRange) {
        try {
          previous = await getAccountInsights(req.params.id, prevRange.timeRange)
        } catch { /* previous period might not exist */ }
      }
    }
    res.json({ current, previous, compareMode })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/accounts/:id/insights/timeseries', async (req, res) => {
  try {
    const { timeRange, datePreset } = parseDateParams(req.query)
    const params: Record<string, string> = {
      fields: [
        'date_start', 'date_stop',
        'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
        'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
      ].join(','),
      level: 'account',
      time_increment: '1',
      limit: '500',
    }
    if (timeRange) {
      params.time_range = timeRange
    } else if (datePreset) {
      params.date_preset = datePreset
    } else {
      params.date_preset = 'last_7d'
    }
    const url = new URL(`https://graph.facebook.com/v21.0/${req.params.id}/insights`)
    const { META_ACCESS_TOKEN, META_APP_SECRET } = await import('./config.ts')
    const { createHmac } = await import('crypto')
    const proof = createHmac('sha256', META_APP_SECRET).update(META_ACCESS_TOKEN).digest('hex')
    url.searchParams.set('access_token', META_ACCESS_TOKEN)
    url.searchParams.set('appsecret_proof', proof)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    const response = await fetch(url.toString())
    const json = await response.json()
    if (json.error) throw new Error(json.error.message)
    res.json({ data: json.data || [] })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

const LEVEL_CONFIG: Record<string, { level: 'campaign' | 'adset' | 'ad'; filterField: string }> = {
  campaigns: { level: 'campaign', filterField: 'campaign.id' },
  adsets: { level: 'adset', filterField: 'adset.id' },
  ads: { level: 'ad', filterField: 'ad.id' },
}

app.get('/api/accounts/:id/:level/:entityId/timeseries', async (req, res) => {
  try {
    const config = LEVEL_CONFIG[req.params.level]
    if (!config) {
      res.status(400).json({ error: 'Invalid level. Use campaigns, adsets, or ads.' })
      return
    }
    const { timeRange, datePreset } = parseDateParams(req.query)
    const data = await getEntityTimeseries(
      req.params.id,
      config.level,
      config.filterField,
      req.params.entityId,
      timeRange,
      datePreset
    )
    res.json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Meta Ads proxy server running on http://localhost:${PORT}`)
})
