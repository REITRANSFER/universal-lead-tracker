'use client'

import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'
import { filterParams } from '@/lib/filter-params'
import { useAnalytics } from '@/hooks/use-analytics'
import { useClients } from '@/hooks/use-clients'
import { UtmTable } from '@/components/analytics/utm-table'
import { DuplicateRateSection } from '@/components/analytics/duplicate-rate-section'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-wrapper'

export default function AnalyticsPage() {
  const [filters] = useQueryStates(filterParams)

  const { data, loading } = useAnalytics({
    clients: filters.clients?.length ? filters.clients : undefined,
    from: filters.from?.toISOString() ?? null,
    to: filters.to?.toISOString() ?? null,
  })

  const { clients } = useClients()

  // Build map of client_slug → survey_version for DuplicateRateSection
  const clientSurveyVersions = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const c of clients) {
      map.set(c.client_slug, c.survey_version)
    }
    return map
  }, [clients])

  const totalLeads = data?.total_leads ?? 0
  const totalDuplicates = data?.total_duplicates ?? 0
  const dupRate = totalLeads > 0 ? Math.round((totalDuplicates / totalLeads) * 100) : 0

  return (
    <StaggerContainer className="space-y-6">
      {/* Page header */}
      <StaggerItem>
        <div>
          <h1 className="text-3xl font-bold tracking-tight page-header-accent">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? 'Loading...'
              : data
                ? `${data.total_leads.toLocaleString()} leads — ${data.total_duplicates.toLocaleString()} duplicates`
                : 'UTM attribution and duplicate rates'}
          </p>
        </div>
      </StaggerItem>

      {/* Hero stat banner */}
      {!loading && data && (
        <StaggerItem>
          <div className="glass-card section-glow rounded-xl p-6 flex items-center gap-8 overflow-hidden relative">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Leads Tracked</p>
              <div className="flex items-baseline gap-3">
                <AnimatedCounter
                  value={totalLeads}
                  className="text-5xl font-bold tracking-tight tabular-nums"
                />
                <span className="text-sm text-muted-foreground">leads</span>
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Duplicates</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter
                  value={totalDuplicates}
                  className="text-3xl font-bold tracking-tight tabular-nums text-yellow-400"
                />
                <span className="text-sm text-muted-foreground">({dupRate}%)</span>
              </div>
            </div>
            {/* Decorative gradient blob */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          </div>
        </StaggerItem>
      )}

      {/* UTM tables — 3-column grid on desktop */}
      <StaggerItem>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <UtmTable
            title="Traffic Source"
            rows={data?.utm_source ?? []}
            loading={loading}
          />
          <UtmTable
            title="Medium"
            rows={data?.utm_medium ?? []}
            loading={loading}
          />
          <UtmTable
            title="Campaign"
            rows={data?.utm_campaign ?? []}
            loading={loading}
          />
        </div>
      </StaggerItem>

      {/* Per-client duplicate rate breakdown */}
      <StaggerItem>
        <DuplicateRateSection
          rates={data?.duplicate_rates ?? []}
          clientSurveyVersions={clientSurveyVersions}
          loading={loading}
        />
      </StaggerItem>
    </StaggerContainer>
  )
}
