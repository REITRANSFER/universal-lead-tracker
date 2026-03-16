'use client'

import { useState, useCallback, useEffect } from 'react'

interface ClientCount {
  client_slug: string
  count: number
  duplicate_count: number
}

interface HeatmapCell {
  /** "__all__" for the aggregate row, or a specific client_slug */
  client_slug: string
  date: string
  count: number
}

export interface StatsData {
  clientCounts: ClientCount[]
  topPerformer: ClientCount | null
  heatmap: HeatmapCell[]
  total_duplicates?: number
}

interface UseStatsReturn {
  data: StatsData | null
  loading: boolean
  refresh: () => void
}

function buildUrl(from?: string, to?: string): string {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return `/api/stats${qs ? `?${qs}` : ''}`
}

export function useStats(from?: string, to?: string): UseStatsReturn {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const url = buildUrl(from, to)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: StatsData = await res.json()
      setData(json)
    } catch (err) {
      console.error('[useStats] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { data, loading, refresh: fetchStats }
}
