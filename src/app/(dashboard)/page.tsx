export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">
          Lead analytics and metrics coming in Phase 4
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Phase 3 Complete
          </span>
          <span className="inline-flex items-center rounded-full bg-chart-2/10 px-3 py-1 text-xs font-medium text-chart-2">
            Auth + Shell
          </span>
        </div>
      </div>
    </div>
  )
}
