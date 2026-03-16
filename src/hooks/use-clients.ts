'use client'

import { useState, useEffect } from 'react'

export interface Client {
  client_slug: string
  name: string
  survey_version: string | null
}

interface UseClientsReturn {
  clients: Client[]
  loading: boolean
  error: string | null
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchClients() {
      try {
        const res = await fetch('/api/clients')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Client[] = await res.json()
        if (!cancelled) {
          setClients(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load clients')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchClients()
    return () => {
      cancelled = true
    }
  }, [])

  return { clients, loading, error }
}
