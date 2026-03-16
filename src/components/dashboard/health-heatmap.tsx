'use client'

import { useMemo, useState } from 'react'
import type { StatsData } from '@/hooks/use-stats'

interface ClientInfo {
  client_slug: string
  name: string
}

interface HealthHeatmapProps {
  data: StatsData | null
  loading: boolean
  /** ISO date string for range start */
  from?: string
  /** ISO date string for range end */
  to?: string
  /** Full client list from /api/clients — includes silent clients with 0 leads */
  allClients?: ClientInfo[]
}

function getColorClass(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2) return 'bg-green-900/60'
  if (count <= 5) return 'bg-green-700/70'
  return 'bg-green-500'
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDayOfWeek(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

/** Generate an array of ISO date strings for the last N days ending today (or `to`) */
function generateDayRange(numDays: number, endDate?: string): string[] {
  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date()
  end.setHours(0, 0, 0, 0)
  const days: string[] = []
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/10 ${className ?? ''}`} />
  )
}

interface TooltipState {
  label: string
  date: string
  count: number
  x: number
  y: number
}

export function HealthHeatmap({ data, loading, from, to, allClients = [] }: HealthHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Build aggregate map (client_slug === "__all__"): date → count
  const aggregateMap = useMemo(() => {
    const map = new Map<string, number>()
    if (data?.heatmap) {
      for (const cell of data.heatmap) {
        if (cell.client_slug === '__all__') {
          map.set(cell.date, cell.count)
        }
      }
    }
    return map
  }, [data])

  // Build per-client map: client_slug → (date → count)
  const clientDayMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    if (data?.heatmap) {
      for (const cell of data.heatmap) {
        if (cell.client_slug === '__all__') continue
        if (!map.has(cell.client_slug)) {
          map.set(cell.client_slug, new Map<string, number>())
        }
        map.get(cell.client_slug)!.set(cell.date, cell.count)
      }
    }
    return map
  }, [data])

  // Build sorted client list: active clients (by total desc) then silent clients (alphabetically)
  const sortedClients = useMemo(() => {
    // Use allClients if provided; fall back to clients from clientCounts
    const clientCountMap = new Map<string, number>()
    if (data?.clientCounts) {
      for (const cc of data.clientCounts) {
        clientCountMap.set(cc.client_slug, cc.count)
      }
    }

    let clientList: ClientInfo[]
    if (allClients.length > 0) {
      clientList = allClients
    } else {
      // Fallback: build from clientCounts only (no silent clients)
      clientList = (data?.clientCounts ?? []).map((cc) => ({
        client_slug: cc.client_slug,
        name: cc.client_slug,
      }))
    }

    // Compute total in range per client from clientDayMap
    const withTotals = clientList.map((c) => {
      const dateMap = clientDayMap.get(c.client_slug)
      const total = dateMap
        ? Array.from(dateMap.values()).reduce((sum, n) => sum + n, 0)
        : 0
      return { ...c, total }
    })

    // Active clients first (descending by total), then silent (alphabetical by name)
    const active = withTotals.filter((c) => c.total > 0).sort((a, b) => b.total - a.total)
    const silent = withTotals.filter((c) => c.total === 0).sort((a, b) => a.name.localeCompare(b.name))

    return [...active, ...silent]
  }, [allClients, data, clientDayMap])

  // Build list of days to display (last 14 days, or bounded by from/to)
  const days = useMemo(() => {
    // If we have a from/to range, show up to 14 days from the end
    return generateDayRange(14, to)
  }, [to])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          Activity Heatmap
        </p>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 min-w-[600px]"
            style={{
              gridTemplateColumns: `120px repeat(14, 1fr)`,
            }}
          >
            {/* Header row */}
            <div />
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            {/* Data rows skeleton */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <>
                <Skeleton key={`label-${rowIdx}`} className="h-7 w-full" />
                {Array.from({ length: 14 }).map((_, colIdx) => (
                  <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-7 w-full" />
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (sortedClients.length === 0 && aggregateMap.size === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Activity Heatmap
        </p>
        <p className="text-sm text-muted-foreground">
          No lead data available for this period.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          Activity Heatmap
          <span className="ml-2 text-xs">
            (last 14 days · per-client)
          </span>
        </p>
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-zinc-800 border border-white/10" />
            <div className="h-3 w-3 rounded-sm bg-green-900/60" />
            <div className="h-3 w-3 rounded-sm bg-green-700/70" />
            <div className="h-3 w-3 rounded-sm bg-green-500" />
          </div>
          <span>High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1 min-w-[600px]"
          style={{
            gridTemplateColumns: `120px repeat(14, 1fr)`,
          }}
        >
          {/* Header row: empty label col + date headers */}
          <div /> {/* empty corner */}
          {days.map((day) => (
            <div key={day} className="text-center">
              <div className="text-[10px] text-muted-foreground leading-tight">
                {formatDayOfWeek(day)}
              </div>
              <div className="text-[10px] text-muted-foreground/60 leading-tight">
                {formatDateLabel(day)}
              </div>
            </div>
          ))}

          {/* Daily totals row — shows overall activity across all clients */}
          <div className="flex items-center pr-2">
            <span className="text-xs text-muted-foreground truncate">
              All clients
            </span>
          </div>
          {days.map((day) => {
            const count = aggregateMap.get(day) ?? 0
            return (
              <div
                key={day}
                className={`h-7 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getColorClass(count)}`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltip({
                    label: 'All clients',
                    date: day,
                    count,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

          {/* Per-client rows */}
          {sortedClients.map((client) => (
            <>
              <div
                key={`label-${client.client_slug}`}
                className="flex items-center pr-2"
              >
                <span
                  className="text-xs truncate"
                  title={client.name !== client.client_slug ? `${client.name} (${client.client_slug})` : client.client_slug}
                >
                  {client.name}
                </span>
              </div>
              {days.map((day) => {
                const count = clientDayMap.get(client.client_slug)?.get(day) ?? 0
                return (
                  <div
                    key={`${client.client_slug}-${day}`}
                    className={`h-7 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getColorClass(count)}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({
                        label: client.name,
                        date: day,
                        count,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-zinc-900 border border-white/10 px-2 py-1 text-xs shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="font-medium">{tooltip.label}</span>
          <span className="mx-1 text-muted-foreground">·</span>
          <span className="text-muted-foreground">{formatDateLabel(tooltip.date)}</span>
          <span className="ml-2 text-muted-foreground">
            {tooltip.count} lead{tooltip.count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
