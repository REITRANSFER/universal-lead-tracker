'use client'

import type { DuplicateRate } from '@/hooks/use-analytics'

// ---------------------------------------------------------------------------
// Per-client duplicate rate breakdown
// ---------------------------------------------------------------------------

interface DuplicateRateSectionProps {
  rates: DuplicateRate[]
  /** Map of client_slug → survey_version (or null if unknown) */
  clientSurveyVersions: Map<string, string | null>
  loading: boolean
}

function getDupRateColor(rate: number): string {
  if (rate < 5) return 'text-green-400'
  if (rate < 15) return 'text-yellow-400'
  return 'text-red-400'
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="animate-pulse rounded bg-white/10 h-4 flex-1" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-12" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-16" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-16" />
          <div className="animate-pulse rounded bg-white/10 h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function DuplicateRateSection({
  rates,
  clientSurveyVersions,
  loading,
}: DuplicateRateSectionProps) {
  // Sort by rate descending (already sorted by API, but keep explicit)
  const sorted = [...rates].sort((a, b) => b.rate - a.rate)

  return (
    <div className="glass-card rounded-xl p-6">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        Duplicate Rate by Client
      </p>

      {loading ? (
        <SkeletonRows />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No duplicate data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/10">
                <th className="text-left py-2 pr-4 font-medium">Client</th>
                <th className="text-left py-2 pr-4 font-medium">Survey Ver.</th>
                <th className="text-right py-2 pr-4 font-medium">Total Leads</th>
                <th className="text-right py-2 pr-4 font-medium">Duplicates</th>
                <th className="text-right py-2 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map((row) => {
                const surveyVer = clientSurveyVersions.get(row.client_slug) ?? null
                return (
                  <tr key={row.client_slug} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs truncate max-w-[200px]">
                      {row.client_slug}
                    </td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {surveyVer ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                      {row.duplicates.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums font-medium ${getDupRateColor(row.rate)}`}
                    >
                      {row.rate}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
