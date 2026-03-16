'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Star, Flag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Lead type
// ---------------------------------------------------------------------------

export interface Lead {
  id: string
  client_slug: string
  received_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  survey_answers: Record<string, unknown>
  is_duplicate: boolean | null
  duplicate_match_id: string | null
  is_starred: boolean
  is_flagged: boolean
  survey_version: string | null
}

// ---------------------------------------------------------------------------
// Table meta — actions injected by parent component
// ---------------------------------------------------------------------------

export interface LeadsTableMeta {
  onStar: (id: string, current: boolean) => void
  onFlag: (id: string, current: boolean) => void
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const columns: ColumnDef<Lead>[] = [
  // Date received
  {
    accessorKey: 'received_at',
    header: 'Received',
    enableSorting: true,
    cell: ({ row }) => {
      const raw = row.original.received_at
      if (!raw) return '—'
      try {
        return format(new Date(raw), 'MMM d, yyyy h:mm a')
      } catch {
        return raw
      }
    },
  },

  // Client badge
  {
    accessorKey: 'client_slug',
    header: 'Client',
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-xs">
        {row.original.client_slug}
      </Badge>
    ),
  },

  // Full name (computed from first + last) + duplicate badge
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) =>
      [row.first_name, row.last_name].filter(Boolean).join(' ') || '—',
    cell: ({ row }) => {
      const name =
        [row.original.first_name, row.original.last_name]
          .filter(Boolean)
          .join(' ') || '—'
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {row.original.is_duplicate && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 h-4 font-normal opacity-80"
            >
              Dup
            </Badge>
          )}
        </div>
      )
    },
  },

  // Phone
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone ?? '—',
  },

  // Email
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.email ?? '—'}</span>
    ),
  },

  // Actions: star / flag
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as LeadsTableMeta | undefined
      const lead = row.original

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={lead.is_starred ? 'Unstar lead' : 'Star lead'}
            onClick={() => meta?.onStar(lead.id, lead.is_starred)}
          >
            <Star
              className={`h-4 w-4 ${
                lead.is_starred
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={lead.is_flagged ? 'Unflag lead' : 'Flag lead'}
            onClick={() => meta?.onFlag(lead.id, lead.is_flagged)}
          >
            <Flag
              className={`h-4 w-4 ${
                lead.is_flagged
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
        </div>
      )
    },
  },
]
