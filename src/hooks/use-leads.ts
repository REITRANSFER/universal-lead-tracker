'use client'

import { useState, useCallback, useRef } from 'react'
import type { Lead } from '@/components/leads/columns'

const PAGE_SIZE = 25

interface LeadFilters {
  clients?: string[]
  from?: Date | null
  to?: Date | null
  q?: string
  sort?: string
}

interface UseLeadsReturn {
  leads: Lead[]
  total: number
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

function buildUrl(filters: LeadFilters, offset: number): string {
  const params = new URLSearchParams()

  if (filters.clients && filters.clients.length > 0) {
    filters.clients.forEach((c) => params.append('client', c))
  }
  if (filters.from) {
    params.set('from', filters.from.toISOString())
  }
  if (filters.to) {
    params.set('to', filters.to.toISOString())
  }
  if (filters.q) {
    params.set('q', filters.q)
  }
  if (filters.sort) {
    params.set('sort', filters.sort)
  }

  params.set('offset', String(offset))
  params.set('limit', String(PAGE_SIZE))

  return `/api/leads?${params.toString()}`
}

export function useLeads(filters: LeadFilters = {}): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)

  // Stable ref to latest filters to avoid stale closures
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const fetchLeads = useCallback(
    async (currentOffset: number, append: boolean) => {
      setLoading(true)
      try {
        const url = buildUrl(filtersRef.current, currentOffset)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const newLeads: Lead[] = data.leads ?? []
        const newTotal: number = data.total ?? 0

        setTotal(newTotal)
        setLeads((prev) => (append ? [...prev, ...newLeads] : newLeads))
        setOffset(currentOffset + newLeads.length)
      } catch (err) {
        console.error('[useLeads] fetch error:', err)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const refresh = useCallback(() => {
    setOffset(0)
    fetchLeads(0, false)
  }, [fetchLeads])

  const loadMore = useCallback(() => {
    if (loading) return
    fetchLeads(offset, true)
  }, [fetchLeads, loading, offset])

  return { leads, total, loading, hasMore: offset < total, loadMore, refresh }
}
