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
import { TrendingUp, Users, AlertTriangle, BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  const [filters] = useQueryStates(filterParams)

  const { data, loading } = useAnalytics({
    clients: filters.clients?.length ? filters.clients : undefined,
    from: filters.from?.toISOString() ?? null,
    to: filters.to?.toISOString() ?? null,
  })

  const { clients } = useClients()

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
  const maxVolume = Math.max(1, ...((data?.lead_volume ?? []).map(v => v.count)))
  const maxClientCount = Math.max(1, ...((data?.client_breakdown ?? []).map(c => c.count)))

  return (
    <StaggerContainer className="space-y-6">
      {/* Page header */}
      <StaggerItem>
        <div>
          <h1 className="text-3xl font-bold tracking-tight page-header-accent">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Loading...' : 'Lead volume, client breakdown, and attribution'}
          </p>
        </div>
      </StaggerItem>

      {/* Hero stat cards — 4 cards */}
      {!loading && data && (
        <StaggerItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <TrendingUp className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Leads</p>
              <AnimatedCounter value={totalLeads} className="text-3xl font-bold tracking-tight tabular-nums" />
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <Users className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Active Clients</p>
              <AnimatedCounter value={data.client_breakdown.length} className="text-3xl font-bold tracking-tight tabular-nums" />
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <AlertTriangle className="absolute top-3 right-3 h-5 w-5 text-yellow-400/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Duplicates</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter value={totalDuplicates} className="text-3xl font-bold tracking-tight tabular-nums text-yellow-400" />
                <span className="text-sm text-muted-foreground">({dupRate}%)</span>
              </div>
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <BarChart2 className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">With UTM Data</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter value={data.leads_with_utm} className="text-3xl font-bold tracking-tight tabular-nums" />
                <span className="text-sm text-muted-foreground">
                  ({totalLeads > 0 ? Math.round((data.leads_with_utm / totalLeads) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Lead Volume Timeline */}
      {!loading && data && data.lead_volume.length > 0 && (
        <StaggerItem>
          <div className="glass-card section-glow rounded-xl p-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Lead Volume Over Time</h2>
            <div className="flex items-end gap-[2px] h-32">
              {data.lead_volume.map((point) => {
                const height = Math.max(4, (point.count / maxVolume) * 100)
                return (
                  <div
                    key={point.date}
                    className="group relative flex-1 min-w-[3px]"
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 hover:from-primary hover:to-primary/80"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs whitespace-nowrap">
                        <div className="font-medium">{point.count} leads</div>
                        <div className="text-muted-foreground">{new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{data.lead_volume.length > 0 ? new Date(data.lead_volume[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
              <span>{data.lead_volume.length > 0 ? new Date(data.lead_volume[data.lead_volume.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Client Breakdown + UTM side by side */}
      <StaggerItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Client Breakdown */}
          {!loading && data && data.client_breakdown.length > 0 && (
            <div className="glass-card section-glow rounded-xl p-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Leads by Client</h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.client_breakdown.slice(0, 20).map((client, i) => (
                  <div key={client.client_slug} className="flex items-center gap-3">
                    <span className={`text-xs font-mono w-6 text-right ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'text-muted-foreground'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm truncate">{client.client_slug}</span>
                        <span className="text-xs tabular-nums text-muted-foreground ml-2 shrink-0">{client.count} ({client.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 progress-bar-animated"
                          style={{ width: `${(client.count / maxClientCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Rate by Client */}
          <DuplicateRateSection
            rates={data?.duplicate_rates ?? []}
            clientSurveyVersions={clientSurveyVersions}
            loading={loading}
          />
        </div>
      </StaggerItem>

      {/* UTM tables — only show if there's actual UTM data */}
      {!loading && data && data.leads_with_utm > 0 && (
        <StaggerItem>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              UTM Attribution ({data.leads_with_utm} leads with tracking data)
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <UtmTable title="Traffic Source" rows={data.utm_source} loading={loading} />
              <UtmTable title="Medium" rows={data.utm_medium} loading={loading} />
              <UtmTable title="Campaign" rows={data.utm_campaign} loading={loading} />
            </div>
          </div>
        </StaggerItem>
      )}

      {/* No UTM data message */}
      {!loading && data && data.leads_with_utm === 0 && (
        <StaggerItem>
          <div className="glass-card rounded-xl p-8 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No UTM tracking data yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">UTM attribution will appear as leads come in through tracked campaigns</p>
          </div>
        </StaggerItem>
      )}
    </StaggerContainer>
  )
}
