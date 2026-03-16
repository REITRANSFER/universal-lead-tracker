'use client'

import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'
import { filterParams } from '@/lib/filter-params'
import { useAnalytics } from '@/hooks/use-analytics'
import { useClients } from '@/hooks/use-clients'
import { UtmTable } from '@/components/analytics/utm-table'
import { DuplicateRateSection } from '@/components/analytics/duplicate-rate-section'

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          {loading
            ? 'Loading...'
            : data
              ? `${data.total_leads.toLocaleString()} leads — ${data.total_duplicates.toLocaleString()} duplicates`
              : 'UTM attribution and duplicate rates'}
        </p>
      </div>

      {/* UTM tables — 3-column grid on desktop */}
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

      {/* Per-client duplicate rate breakdown */}
      <DuplicateRateSection
        rates={data?.duplicate_rates ?? []}
        clientSurveyVersions={clientSurveyVersions}
        loading={loading}
      />
    </div>
  )
}
