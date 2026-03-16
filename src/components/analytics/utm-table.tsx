'use client'

// ---------------------------------------------------------------------------
// UTM dimension table with inline bar sparklines
// ---------------------------------------------------------------------------

interface UtmTableProps {
  title: string
  rows: { value: string; count: number; pct: number }[]
  loading: boolean
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="animate-pulse rounded bg-white/10 h-3 w-32" />
          <div className="flex-1 animate-pulse rounded bg-white/10 h-1.5" />
          <div className="animate-pulse rounded bg-white/10 h-3 w-12" />
          <div className="animate-pulse rounded bg-white/10 h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

export function UtmTable({ title, rows, loading }: UtmTableProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      <p className="text-sm font-medium text-muted-foreground mb-4">{title}</p>
      {loading ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.value} className="flex items-center gap-3">
              <span className="text-xs font-mono w-32 shrink-0 truncate text-muted-foreground">
                {row.value}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="text-xs text-right w-12 shrink-0">
                {row.count.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
