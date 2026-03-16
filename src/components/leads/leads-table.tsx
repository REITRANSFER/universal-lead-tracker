'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { columns } from './columns'
import type { Lead, LeadsTableMeta } from './columns'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadsTableProps {
  leads: Lead[]
  total: number
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onSort: (sort: string) => void
  onToggleStar: (id: string, current: boolean) => void
  onToggleFlag: (id: string, current: boolean) => void
  onRowClick?: (lead: Lead) => void
}

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ChevronUp className="h-3.5 w-3.5 opacity-70" />
  if (direction === 'desc') return <ChevronDown className="h-3.5 w-3.5 opacity-70" />
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
}

// ---------------------------------------------------------------------------
// Loading skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className="py-3 px-4">
              <Skeleton className="h-4 w-full max-w-[120px] rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// LeadsTable
// ---------------------------------------------------------------------------

export function LeadsTable({
  leads,
  total,
  loading,
  hasMore,
  onLoadMore,
  onSort,
  onToggleStar,
  onToggleFlag,
  onRowClick,
}: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'received_at', desc: true },
  ])

  const tableMeta: LeadsTableMeta = {
    onStar: onToggleStar,
    onFlag: onToggleFlag,
  }

  const table = useReactTable<Lead>({
    data: leads,
    columns: columns as ColumnDef<Lead>[],
    state: { sorting },
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      if (next.length > 0) {
        const { id, desc } = next[0]
        onSort(`${id}.${desc ? 'desc' : 'asc'}`)
      } else {
        onSort('received_at.desc')
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    meta: tableMeta,
  })

  const showSkeleton = loading && leads.length === 0
  const remaining = total - leads.length

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                        canSort && 'cursor-pointer select-none hover:text-foreground transition-colors'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && <SortIcon direction={sortDirection} />}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              <SkeletonRows cols={columns.length} />
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  {loading ? 'Loading leads...' : 'No leads found'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4"
                      onClick={
                        // Prevent row click when clicking action buttons
                        cell.column.id === 'actions'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[180px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load ${Math.min(remaining, 25)} more of ${remaining}`
            )}
          </Button>
        </div>
      )}

      {/* Total count */}
      {!loading && leads.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {leads.length} of {total} leads
        </p>
      )}
    </div>
  )
}
