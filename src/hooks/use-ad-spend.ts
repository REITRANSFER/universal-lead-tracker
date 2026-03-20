'use client'

import { useState, useCallback, useEffect } from 'react'

export interface AdSpendEntry {
  client_slug: string
  name: string
  daily_budget: number
  spend_7d: number
  avg_daily_spend: number
  cpl_7d: number
  leads_7d: number
  ad_status: string
  budget_pct: number
  is_under_budget: boolean
  budget_updated_at: string | null
}

interface UseAdSpendReturn {
  data: AdSpendEntry[]
  loading: boolean
  syncing: boolean
  refresh: () => void
  sync: () => Promise<void>
  syncResult: SyncResult | null
}

interface SyncResult {
  success: boolean
  updated: number
  skipped: number
  no_match: string[]
  parse_failures: Array<{ name: string; raw: string }>
  total_tasks: number
  synced_at: string
}

export function useAdSpend(): UseAdSpendReturn {
  const [data, setData] = useState<AdSpendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ad-spend')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: AdSpendEntry[] = await res.json()
      setData(json)
    } catch (err) {
      console.error('[useAdSpend] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const sync = useCallback(async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/ad-spend/sync', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result: SyncResult = await res.json()
      setSyncResult(result)
      // Refresh data after sync
      await fetchData()
    } catch (err) {
      console.error('[useAdSpend] sync error:', err)
    } finally {
      setSyncing(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, syncing, refresh: fetchData, sync, syncResult }
}
