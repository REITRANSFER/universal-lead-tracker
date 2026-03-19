'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryStates } from 'nuqs'
import { filterParams } from '@/lib/filter-params'
import { useLeads } from '@/hooks/use-leads'
import { LeadsFilters } from '@/components/leads/leads-filters'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadDrawer } from '@/components/leads/lead-drawer'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-wrapper'
import type { Lead } from '@/components/leads/columns'

export default function LeadsPage() {
  const [filters] = useQueryStates(filterParams)

  // Track sort param separately (not in URL — handled by table component)
  const sortRef = useRef('received_at.desc')

  const { leads, total, loading, hasMore, loadMore, refresh } = useLeads({
    clients: filters.clients && filters.clients.length > 0 ? filters.clients : undefined,
    from: filters.from ?? null,
    to: filters.to ?? null,
    q: filters.q || undefined,
    sort: sortRef.current,
  })

  // Refresh when URL filters change
  const prevFiltersRef = useRef(filters)
  useEffect(() => {
    const prev = prevFiltersRef.current
    const hasChanged =
      JSON.stringify(prev.clients) !== JSON.stringify(filters.clients) ||
      prev.from?.toISOString() !== filters.from?.toISOString() ||
      prev.to?.toISOString() !== filters.to?.toISOString() ||
      prev.q !== filters.q
    if (hasChanged) {
      prevFiltersRef.current = filters
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.clients, filters.from, filters.to, filters.q])

  // Initial fetch on mount
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sort handler — update sort ref and re-fetch from top
  const handleSort = useCallback(
    (sort: string) => {
      sortRef.current = sort
      refresh()
    },
    [refresh]
  )

  // Star toggle with PATCH + refresh
  const handleToggleStar = useCallback(
    async (id: string, current: boolean) => {
      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_starred: !current }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        refresh()
      } catch (err) {
        console.error('[LeadsPage] toggleStar error:', err)
      }
    },
    [refresh]
  )

  // Flag toggle with PATCH + refresh
  const handleToggleFlag = useCallback(
    async (id: string, current: boolean) => {
      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_flagged: !current }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        refresh()
      } catch (err) {
        console.error('[LeadsPage] toggleFlag error:', err)
      }
    },
    [refresh]
  )

  // ---------------------------------------------------------------------------
  // Drawer state — selected lead index for prev/next nav
  // ---------------------------------------------------------------------------

  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number | null>(null)
  const selectedLead: Lead | null =
    selectedLeadIndex !== null ? (leads[selectedLeadIndex] ?? null) : null

  // Row click — open drawer
  const handleRowClick = useCallback((lead: Lead) => {
    const idx = leads.findIndex((l) => l.id === lead.id)
    if (idx !== -1) setSelectedLeadIndex(idx)
  }, [leads])

  // Drawer close
  const handleDrawerClose = useCallback(() => {
    setSelectedLeadIndex(null)
  }, [])

  // Drawer prev / next
  const handleDrawerPrev = useCallback(() => {
    setSelectedLeadIndex((idx) => (idx !== null && idx > 0 ? idx - 1 : idx))
  }, [])

  const handleDrawerNext = useCallback(() => {
    setSelectedLeadIndex((idx) =>
      idx !== null && idx < leads.length - 1 ? idx + 1 : idx
    )
  }, [leads.length])

  // Drawer star/flag — pass current value from the live lead
  const handleDrawerToggleStar = useCallback(
    (id: string) => {
      const lead = leads.find((l) => l.id === id)
      if (lead) handleToggleStar(id, lead.is_starred)
    },
    [leads, handleToggleStar]
  )

  const handleDrawerToggleFlag = useCallback(
    (id: string) => {
      const lead = leads.find((l) => l.id === id)
      if (lead) handleToggleFlag(id, lead.is_flagged)
    },
    [leads, handleToggleFlag]
  )

  return (
    <StaggerContainer className="space-y-6">
      {/* Page header */}
      <StaggerItem>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {loading && leads.length === 0
              ? 'Loading...'
              : `${total.toLocaleString()} lead${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
      </StaggerItem>

      {/* Filters bar */}
      <StaggerItem>
        <LeadsFilters />
      </StaggerItem>

      {/* Leads table */}
      <StaggerItem>
        <LeadsTable
          leads={leads}
          total={total}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onSort={handleSort}
          onToggleStar={handleToggleStar}
          onToggleFlag={handleToggleFlag}
          onRowClick={handleRowClick}
        />
      </StaggerItem>

      {/* Lead detail drawer */}
      <LeadDrawer
        lead={selectedLead}
        onClose={handleDrawerClose}
        onPrev={handleDrawerPrev}
        onNext={handleDrawerNext}
        hasPrev={selectedLeadIndex !== null && selectedLeadIndex > 0}
        hasNext={
          selectedLeadIndex !== null && selectedLeadIndex < leads.length - 1
        }
        onToggleStar={handleDrawerToggleStar}
        onToggleFlag={handleDrawerToggleFlag}
      />
    </StaggerContainer>
  )
}
