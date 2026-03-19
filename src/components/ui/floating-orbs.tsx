'use client'

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/[0.03] blur-3xl animate-orb-drift" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/[0.02] blur-3xl animate-orb-drift-reverse" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white/[0.01] blur-3xl animate-orb-pulse" />
    </div>
  )
}
