'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SessionExpiryModal({ expiresAt }: { expiresAt: number }) {
  const router = useRouter()
  const [expired, setExpired] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const msUntilExpiry = expiresAt * 1000 - Date.now()
    if (msUntilExpiry <= 0) {
      setExpired(true)
      return
    }
    const timer = setTimeout(() => setExpired(true), msUntilExpiry)
    return () => clearTimeout(timer)
  }, [expiresAt])

  async function handleReauth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setExpired(false)
        setPassword('')
        router.refresh()
        return
      }

      setError('Incorrect password')
      setPassword('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!expired) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-center mb-2">
          Session expired
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Re-enter your password to continue
        </p>

        <form onSubmit={handleReauth} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            variant="ghost"
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium"
            disabled={loading || !password}
          >
            {loading ? 'Authenticating...' : 'Re-authenticate'}
          </Button>
        </form>
      </div>
    </div>
  )
}
