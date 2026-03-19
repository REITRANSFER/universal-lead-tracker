'use client'

// ---------------------------------------------------------------------------
// UTM dimension table with inline bar sparklines, rank badges, and % badges
// ---------------------------------------------------------------------------

interface UtmTableProps {
  title: string
  rows: { value: string; count: number; pct: number }[]
  loading: boolean
}

function getRankStyle(idx: number): string {
  if (idx === 0) return 'rank-gold font-bold'
  if (idx === 1) return 'rank-silver font-bold'
  if (idx === 2) return 'rank-bronze font-bold'
  return 'text-muted-foreground'
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="animate-pulse rounded bg-white/10 h-3 w-5" />
          <div className="animate-pulse rounded bg-white/10 h-3 w-32" />
          <div className="flex-1 animate-pulse rounded bg-white/10 h-1.5" />
          <div className="animate-pulse rounded bg-white/10 h-3 w-12" />
          <div className="animate-pulse rounded bg-white/10 h-5 w-10" />
        </div>
      ))}
    </div>
  )
}

export function UtmTable({ title, rows, loading }: UtmTableProps) {
  return (
    <div className="glass-card section-glow rounded-xl p-6">
      <p className="text-sm font-medium text-muted-foreground mb-4">{title}</p>
      {loading ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={row.value} className="flex items-center gap-3">
              {/* Rank badge */}
              <span className={`text-xs w-5 shrink-0 text-right font-mono ${getRankStyle(idx)}`}>
                #{idx + 1}
              </span>
              <span className="text-xs font-mono w-32 shrink-0 truncate text-muted-foreground">
                {row.value}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="text-xs text-right w-12 shrink-0 tabular-nums">
                {row.count.toLocaleString()}
              </span>
              {/* Percentage badge */}
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 tabular-nums ${
                  idx === 0
                    ? 'bg-primary/15 text-primary'
                    : 'bg-white/5 text-muted-foreground'
                }`}
              >
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
