'use client'

import { useState, useCallback } from 'react'

interface UseCopyReturn {
  copied: boolean
  copy: (text: string) => Promise<void>
}

/**
 * Clipboard copy hook.
 *
 * Usage:
 *   const { copied, copy } = useCopy()
 *   <button onClick={() => copy(email)}>{copied ? 'Copied!' : 'Copy'}</button>
 */
export function useCopy(timeout = 2000): UseCopyReturn {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), timeout)
      } catch (err) {
        console.error('[useCopy] clipboard error:', err)
      }
    },
    [timeout]
  )

  return { copied, copy }
}
