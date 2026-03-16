'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryStates } from 'nuqs'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Search, CalendarIcon, ChevronDown, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { filterParams } from '@/lib/filter-params'
import { useClients } from '@/hooks/use-clients'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeadsFiltersProps {
  onFiltersChange?: () => void
}

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

interface DatePreset {
  label: string
  getRange: () => DateRange
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'This week',
    getRange: () => {
      const now = new Date()
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    },
  },
  {
    label: 'Last month',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    },
  },
  {
    label: 'This quarter',
    getRange: () => {
      const now = new Date()
      return { from: startOfQuarter(now), to: endOfQuarter(now) }
    },
  },
]

// ---------------------------------------------------------------------------
// LeadsFilters component
// ---------------------------------------------------------------------------

export function LeadsFilters({ onFiltersChange }: LeadsFiltersProps) {
  const [filters, setFilters] = useQueryStates(filterParams)
  const { clients } = useClients()

  // --- Search with debounce ---
  const [searchInput, setSearchInput] = useState(filters.q ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local search in sync when URL resets (e.g. clearing filters externally)
  const prevQ = useRef(filters.q)
  useEffect(() => {
    if (filters.q !== prevQ.current && filters.q !== searchInput) {
      setSearchInput(filters.q ?? '')
    }
    prevQ.current = filters.q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        await setFilters({ q: value || null })
        onFiltersChange?.()
      }, 300)
    },
    [setFilters, onFiltersChange]
  )

  // --- Client multi-select ---
  const [clientOpen, setClientOpen] = useState(false)
  const selectedClients: string[] = filters.clients ?? []

  const toggleClient = useCallback(
    async (slug: string) => {
      const next = selectedClients.includes(slug)
        ? selectedClients.filter((c) => c !== slug)
        : [...selectedClients, slug]
      await setFilters({ clients: next.length > 0 ? next : null })
      onFiltersChange?.()
    },
    [selectedClients, setFilters, onFiltersChange]
  )

  const removeClient = useCallback(
    async (slug: string) => {
      const next = selectedClients.filter((c) => c !== slug)
      await setFilters({ clients: next.length > 0 ? next : null })
      onFiltersChange?.()
    },
    [selectedClients, setFilters, onFiltersChange]
  )

  // --- Date range picker ---
  const [dateOpen, setDateOpen] = useState(false)

  const dateRange: DateRange = {
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
  }

  const handleDateSelect = useCallback(
    async (range: DateRange | undefined) => {
      await setFilters({
        from: range?.from ?? null,
        to: range?.to ?? null,
      })
      onFiltersChange?.()
    },
    [setFilters, onFiltersChange]
  )

  const applyPreset = useCallback(
    async (preset: DatePreset) => {
      const range = preset.getRange()
      await setFilters({
        from: range.from ?? null,
        to: range.to ?? null,
      })
      setDateOpen(false)
      onFiltersChange?.()
    },
    [setFilters, onFiltersChange]
  )

  const clearDate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      await setFilters({ from: null, to: null })
      onFiltersChange?.()
    },
    [setFilters, onFiltersChange]
  )

  // --- Date display ---
  const dateLabel = (() => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
    }
    if (dateRange.from) return `From ${format(dateRange.from, 'MMM d, yyyy')}`
    return 'All time'
  })()

  const hasDateFilter = !!(dateRange.from || dateRange.to)

  // --- Client name lookup ---
  const clientName = (slug: string) =>
    clients.find((c) => c.client_slug === slug)?.name ?? slug

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      {/* Global search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 w-full"
          placeholder="Search by name, phone, or email..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Client multi-select */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Popover open={clientOpen} onOpenChange={setClientOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-between min-w-[160px]',
                selectedClients.length > 0 && 'border-primary/60'
              )}
            >
              <span className="truncate">
                {selectedClients.length === 0
                  ? 'All Clients'
                  : `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search clients..." />
              <CommandList>
                <CommandEmpty>No clients found.</CommandEmpty>
                <CommandGroup>
                  {clients.map((client) => {
                    const isSelected = selectedClients.includes(client.client_slug)
                    return (
                      <CommandItem
                        key={client.client_slug}
                        value={client.client_slug}
                        onSelect={() => toggleClient(client.client_slug)}
                        className="flex items-center gap-2"
                      >
                        {/* Checkbox indicator */}
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border'
                          )}
                        >
                          {isSelected && (
                            <svg
                              viewBox="0 0 8 8"
                              className="h-2.5 w-2.5 fill-current"
                            >
                              <path d="M1 4l2.5 2.5L7 1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{client.name}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected client chips */}
        {selectedClients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedClients.map((slug) => (
              <Badge
                key={slug}
                variant="secondary"
                className="gap-1 text-xs pr-1"
              >
                <span className="max-w-[100px] truncate">{clientName(slug)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${clientName(slug)} filter`}
                  className="ml-0.5 rounded-full hover:bg-foreground/20 p-0.5 transition-colors"
                  onClick={() => removeClient(slug)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Date range picker */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-between min-w-[160px] shrink-0',
              hasDateFilter && 'border-primary/60'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate flex-1 text-left">{dateLabel}</span>
            {hasDateFilter && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date filter"
                className="ml-1 rounded-full hover:bg-foreground/20 p-0.5 transition-colors"
                onClick={clearDate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    clearDate(e as unknown as React.MouseEvent)
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          {/* Presets */}
          <div className="flex flex-col border-b border-border">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="px-4 py-2 text-sm text-left hover:bg-muted transition-colors"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Calendar */}
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            initialFocus
          />
          {/* Clear button */}
          {hasDateFilter && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={async () => {
                  await setFilters({ from: null, to: null })
                  setDateOpen(false)
                  onFiltersChange?.()
                }}
              >
                Clear date filter
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
