'use client'

import { useMemo } from 'react'
import { useAdSpend } from '@/hooks/use-ad-spend'
import type { AdSpendEntry } from '@/hooks/use-ad-spend'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-wrapper'
import { DollarSign, TrendingDown, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'

// ── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getBudgetPctColor(pct: number): string {
  if (pct >= 90) return 'text-green-400'
  if (pct >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

function getBudgetBarColor(pct: number): string {
  if (pct >= 90) return 'bg-green-500'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getStatusBadge(status: string): { label: string; cls: string } {
  const s = status.toLowerCase()
  if (s.includes('active'))
    return { label: 'Active', cls: 'bg-green-500/15 text-green-400 border-green-500/20' }
  if (s.includes('attention') || s.includes('warning'))
    return { label: 'Attention', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
  if (s.includes('pause'))
    return { label: 'Paused', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' }
  if (s.includes('relaunch'))
    return { label: 'Relaunch', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' }
  return { label: status, cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' }
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return 'never'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Skeleton ───────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="animate-pulse rounded bg-white/10 h-4 flex-1" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-20" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-20" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-16" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-16" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-12" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export function AdSpendSection() {
  const { data, loading, syncing, sync, syncResult } = useAdSpend()

  // Compute summary stats
  const summary = useMemo(() => {
    if (data.length === 0) return null

    const totalDailyBudget = data.reduce((sum, d) => sum + d.daily_budget, 0)
    const totalAvgDailySpend = data.reduce((sum, d) => sum + d.avg_daily_spend, 0)
    const overallBudgetPct = totalDailyBudget > 0
      ? Math.round((totalAvgDailySpend / totalDailyBudget) * 1000) / 10
      : 0
    const underSpendingCount = data.filter((d) => d.is_under_budget).length

    // Find most recent sync time
    const latestSync = data.reduce<string | null>((latest, d) => {
      if (!d.budget_updated_at) return latest
      if (!latest) return d.budget_updated_at
      return d.budget_updated_at > latest ? d.budget_updated_at : latest
    }, null)

    return { totalDailyBudget, totalAvgDailySpend, overallBudgetPct, underSpendingCount, latestSync }
  }, [data])

  return (
    <StaggerContainer className="space-y-4">
      {/* Section header with gradient banner */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0d0d0d] via-[#111] to-[#0d0d0d] px-6 py-5">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-green-500/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-red-500/[0.04] blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Facebook Ad Spend</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Budget utilization and cost-per-lead across active campaigns
              </p>
            </div>
            <div className="flex items-center gap-3">
              {summary?.latestSync && (
                <span className="text-xs text-muted-foreground">
                  Last synced: {timeAgo(summary.latestSync)}
                </span>
              )}
              <button
                onClick={() => sync()}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Sync result toast */}
      {syncResult && (
        <StaggerItem>
          <div className="glass-card rounded-xl p-4 border-green-500/20">
            <p className="text-sm text-green-400">
              Sync complete: {syncResult.updated} clients updated
              {syncResult.no_match.length > 0 && (
                <span className="text-yellow-400 ml-2">
                  ({syncResult.no_match.length} unmatched)
                </span>
              )}
            </p>
          </div>
        </StaggerItem>
      )}

      {/* Summary stat cards */}
      {!loading && summary && (
        <StaggerItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <DollarSign className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Daily Budget</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(summary.totalDailyBudget)}</p>
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <TrendingDown className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Daily Spend</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(summary.totalAvgDailySpend)}</p>
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <Users className="absolute top-3 right-3 h-5 w-5 text-primary/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Budget Utilization</p>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${getBudgetPctColor(summary.overallBudgetPct)}`}>
                {summary.overallBudgetPct}%
              </p>
            </div>
            <div className="glass-card section-glow rounded-xl p-5 relative overflow-hidden">
              <AlertTriangle className="absolute top-3 right-3 h-5 w-5 text-yellow-400/20" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Under-Spending</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter value={summary.underSpendingCount} className="text-2xl font-bold tracking-tight tabular-nums text-yellow-400" />
                <span className="text-sm text-muted-foreground">clients</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Ad spend table */}
      <StaggerItem>
        <div className="glass-card section-glow rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Client Budget Breakdown
          </h3>

          {loading ? (
            <SkeletonRows />
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No ad spend data yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Run a sync to pull budget data from ClickUp
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-medium">Client</th>
                    <th className="text-right py-2 pr-4 font-medium">Daily Budget</th>
                    <th className="text-right py-2 pr-4 font-medium">Avg Daily Spend</th>
                    <th className="text-right py-2 pr-4 font-medium w-36">Budget %</th>
                    <th className="text-right py-2 pr-4 font-medium">7d CPL</th>
                    <th className="text-right py-2 pr-4 font-medium">7d Leads</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.map((row) => (
                    <AdSpendRow key={row.client_slug} entry={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StaggerItem>
    </StaggerContainer>
  )
}

// ── Row Component ──────────────────────────────────────────────────────

function AdSpendRow({ entry }: { entry: AdSpendEntry }) {
  const { label, cls } = getStatusBadge(entry.ad_status)
  const barWidth = Math.min(entry.budget_pct, 150) // Cap at 150% for visual

  return (
    <tr className="hover:bg-white/[0.02] transition-colors row-glow">
      <td className="py-2.5 pr-4">
        <span className="font-medium text-sm">{entry.name}</span>
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
        {formatCurrency(entry.daily_budget)}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {formatCurrency(entry.avg_daily_spend)}
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2 justify-end">
          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBudgetBarColor(entry.budget_pct)}`}
              style={{ width: `${Math.min((barWidth / 150) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium tabular-nums w-14 text-right ${getBudgetPctColor(entry.budget_pct)}`}>
            {entry.budget_pct}%
          </span>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {entry.cpl_7d > 0 ? formatCurrency(entry.cpl_7d) : '—'}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {entry.leads_7d > 0 ? entry.leads_7d.toLocaleString() : '—'}
      </td>
      <td className="py-2.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
          {label}
        </span>
      </td>
    </tr>
  )
}
