export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary glow-red">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Lead Tracker</h1>
        <p className="text-muted-foreground text-lg">
          Universal lead tracking for REI Transfer
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 max-w-md w-full text-center">
        <p className="text-sm text-muted-foreground font-mono">
          Dashboard coming soon
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Phase 3
          </span>
          <span className="inline-flex items-center rounded-full bg-chart-2/10 px-3 py-1 text-xs font-medium text-chart-2">
            Auth + Shell
          </span>
        </div>
      </div>
    </div>
  );
}
