'use client'

import { useState, useMemo, useEffect } from 'react'
import { useStats } from '@/hooks/use-stats'
import { useClients } from '@/hooks/use-clients'
import { useLeads } from '@/hooks/use-leads'
import { StatsBar } from '@/components/dashboard/stats-bar'
import { HealthHeatmap } from '@/components/dashboard/health-heatmap'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-wrapper'
import { FloatingOrbs } from '@/components/ui/floating-orbs'

type Preset = '7d' | '30d' | '90d' | 'all'

const PRESETS: { label: string; value: Preset }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
]

function getDateRange(preset: Preset): { from?: string; to?: string } {
  const now = new Date()
  const toStr = now.toISOString().slice(0, 10)

  if (preset === 'all') return {}

  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  return { from: from.toISOString().slice(0, 10), to: toStr }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<Preset>('30d')

  const { from, to } = useMemo(() => getDateRange(preset), [preset])

  const { data, loading } = useStats(from, to)
  const { clients } = useClients()

  // Fetch recent 5 leads for the activity feed
  const { leads: recentLeads, loading: leadsLoading, refresh: refreshLeads } = useLeads({
    sort: 'received_at.desc',
  })

  useEffect(() => {
    refreshLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const last5 = recentLeads.slice(0, 5)

  return (
    <div className="space-y-6 relative">
      {/* Grid pattern background */}
      <div className="grid-pattern fixed inset-0 pointer-events-none z-0" />

      <FloatingOrbs />

      <StaggerContainer className="space-y-6 relative z-10">
        <StaggerItem>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight page-header-accent">Dashboard</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="live-dot" />
                  <span className="text-xs font-medium text-green-400">Live</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getGreeting()}. Here is your lead pipeline overview.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 p-1 bg-white/5 w-fit">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    preset === p.value
                      ? 'bg-primary text-primary-foreground btn-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <StatsBar data={data} loading={loading} />
        </StaggerItem>

        <StaggerItem>
          <HealthHeatmap data={data} loading={loading} from={from} to={to} allClients={clients} />
        </StaggerItem>

        {/* Recent Activity Feed */}
        <StaggerItem>
          <div className="glass-card section-glow rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
              <span className="text-xs text-muted-foreground">Last 5 leads</span>
            </div>
            {leadsLoading && last5.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="animate-pulse rounded-full bg-white/10 h-2.5 w-2.5" />
                    <div className="animate-pulse rounded bg-white/10 h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : last5.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent leads</p>
            ) : (
              <div className="space-y-1">
                {last5.map((lead, idx) => {
                  const isDuplicate = lead.is_duplicate
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors slide-in-right"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isDuplicate ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                      />
                      <span className="text-sm font-medium truncate flex-1">
                        {lead.first_name} {lead.last_name || ''}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {lead.client_slug}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {timeAgo(lead.received_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
