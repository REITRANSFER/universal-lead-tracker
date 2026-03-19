'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import type { StatsData } from '@/hooks/use-stats'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { Sparkles } from '@/components/ui/sparkle'

function getDupRateColor(rate: number): string {
  if (rate < 5) return 'text-green-400'
  if (rate < 15) return 'text-yellow-400'
  return 'text-red-400'
}

interface StatsBarProps {
  data: StatsData | null
  loading: boolean
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className ?? ''}`}
    />
  )
}

export function StatsBar({ data, loading }: StatsBarProps) {
  const [showAll, setShowAll] = useState(false)

  const clientCounts = data?.clientCounts ?? []
  const topPerformer = data?.topPerformer ?? null
  const totalLeads = clientCounts.reduce((sum, c) => sum + c.count, 0)
  const maxCount = clientCounts[0]?.count ?? 1
  const totalDuplicates = data?.total_duplicates ?? 0
  const dupRate = totalLeads > 0 ? Math.round((totalDuplicates / totalLeads) * 100) : 0

  const displayedClients = showAll ? clientCounts : clientCounts.slice(0, 10)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Card 1: Total Leads */}
      <div className="glass-card section-glow rounded-xl p-6 relative overflow-hidden">
        <Sparkles count={4} />
        <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
        {loading ? (
          <Skeleton className="mt-2 h-12 w-28" />
        ) : (
          <p className="mt-2">
            <AnimatedCounter value={totalLeads} className="text-5xl font-bold tabular-nums tracking-tight" />
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          across {loading ? '—' : clientCounts.length} clients
        </p>
        {!loading && data && (
          <p className={`text-xs mt-0.5 ${getDupRateColor(dupRate)}`}>
            {dupRate}% duplicates
          </p>
        )}
      </div>

      {/* Card 2: Top Performer */}
      <div className="glass-card section-glow rounded-xl p-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400 trophy-wiggle" />
          <p className="text-sm font-medium text-muted-foreground">
            Top Performer
          </p>
        </div>
        {loading ? (
          <>
            <Skeleton className="mt-2 h-7 w-40" />
            <Skeleton className="mt-2 h-4 w-20" />
          </>
        ) : topPerformer ? (
          <>
            <p className="mt-2 text-2xl font-bold text-yellow-400 truncate">
              {topPerformer.client_slug}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <AnimatedCounter value={topPerformer.count} className="tabular-nums" /> leads
            </p>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground text-sm">No data</p>
        )}
      </div>

      {/* Card 3: Leaderboard */}
      <div className="glass-card section-glow rounded-xl p-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Leaderboard
        </p>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : clientCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <>
            <ol className="space-y-2">
              {displayedClients.map((client, idx) => (
                <li key={client.client_slug} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-muted-foreground text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs truncate font-medium">
                        {client.client_slug}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {client.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${(client.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {clientCounts.length > 10 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 text-xs text-primary hover:underline"
              >
                {showAll
                  ? 'Show less'
                  : `Show all (${clientCounts.length - 10} more)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
