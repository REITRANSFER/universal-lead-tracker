'use client'

import { useState, useCallback, useEffect } from 'react'

export interface UtmCount {
  value: string
  count: number
  pct: number
}

export interface DuplicateRate {
  client_slug: string
  total: number
  duplicates: number
  rate: number
}

export interface AnalyticsData {
  utm_source: UtmCount[]
  utm_medium: UtmCount[]
  utm_campaign: UtmCount[]
  duplicate_rates: DuplicateRate[]
  total_leads: number
  total_duplicates: number
}

interface UseAnalyticsParams {
  clients?: string[]
  from?: string | null
  to?: string | null
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null
  loading: boolean
  refresh: () => void
}

function buildUrl(params: UseAnalyticsParams): string {
  const qs = new URLSearchParams()
  if (params.clients && params.clients.length > 0) {
    for (const slug of params.clients) {
      qs.append('client', slug)
    }
  }
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const qsStr = qs.toString()
  return `/api/analytics${qsStr ? `?${qsStr}` : ''}`
}

export function useAnalytics(params: UseAnalyticsParams = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  // Serialize params for stable dependency comparison
  const clientsKey = (params.clients ?? []).join(',')
  const from = params.from ?? null
  const to = params.to ?? null

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const url = buildUrl({ clients: params.clients, from, to })
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: AnalyticsData = await res.json()
      setData(json)
    } catch (err) {
      console.error('[useAnalytics] fetch error:', err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientsKey, from, to])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { data, loading, refresh: fetchAnalytics }
}
