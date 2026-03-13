'use client'

import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const particleOptions: Record<string, any> = {
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    color: { value: '#ffffff' },
    links: {
      color: '#ffffff',
      distance: 150,
      enable: true,
      opacity: 0.08,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: 'none',
      outModes: { default: 'out' },
    },
    number: {
      density: { enable: true },
      value: 60,
    },
    opacity: { value: { min: 0.03, max: 0.12 } },
    shape: { type: 'circle' },
    size: { value: { min: 1, max: 2.5 } },
  },
  detectRetina: true,
}

export default function LoginParticles() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Particles
      id="login-particles"
      options={particleOptions}
      className="absolute inset-0 z-0"
    />
  )
}
