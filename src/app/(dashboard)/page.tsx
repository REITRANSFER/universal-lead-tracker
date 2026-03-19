'use client'

import { useState, useMemo } from 'react'
import { useStats } from '@/hooks/use-stats'
import { useClients } from '@/hooks/use-clients'
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

export default function DashboardPage() {
  const [preset, setPreset] = useState<Preset>('30d')

  const { from, to } = useMemo(() => getDateRange(preset), [preset])

  const { data, loading } = useStats(from, to)
  const { clients } = useClients()

  return (
    <div className="space-y-6 relative">
      <FloatingOrbs />

      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
      </StaggerContainer>
    </div>
  )
}
