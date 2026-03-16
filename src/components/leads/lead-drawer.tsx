'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Flag,
  Copy,
  Check,
  Link2,
} from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCopy } from '@/hooks/use-copy'
import type { Lead } from './columns'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadDrawerProps {
  lead: Lead | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  onToggleStar: (id: string) => void
  onToggleFlag: (id: string) => void
}

// ---------------------------------------------------------------------------
// UTM / tracking keys to exclude from survey answers display
// ---------------------------------------------------------------------------

const HIDDEN_SURVEY_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatSurveyValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

// ---------------------------------------------------------------------------
// Copy button (self-contained so each field has its own copied state)
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={() => copy(text)}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field row with optional copy
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  value,
  copyable,
}: {
  label: string
  value: string | null | undefined
  copyable?: boolean
}) {
  const displayValue = value || '—'
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0 w-24">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-sm text-right break-all">{displayValue}</span>
        {copyable && value && <CopyButton text={value} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LeadDrawer
// ---------------------------------------------------------------------------

export function LeadDrawer({
  lead,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onToggleStar,
  onToggleFlag,
}: LeadDrawerProps) {
  // Keyboard: Left/Right for prev/next (Escape handled by Vaul)
  useEffect(() => {
    if (!lead) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lead, hasPrev, hasNext, onPrev, onNext])

  // Derive display values
  const fullName =
    lead
      ? [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Lead'
      : ''

  const receivedFormatted =
    lead?.received_at
      ? (() => {
          try {
            return format(new Date(lead.received_at), 'MMM d, yyyy h:mm a')
          } catch {
            return lead.received_at
          }
        })()
      : '—'

  // Survey answers filtered — exclude UTM keys
  const surveyEntries = lead
    ? Object.entries(lead.survey_answers ?? {}).filter(
        ([key]) => !HIDDEN_SURVEY_KEYS.has(key)
      )
    : []

  return (
    <Drawer
      open={!!lead}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      direction="bottom"
    >
      <DrawerContent className="h-[85dvh] max-h-[85dvh] flex flex-col">
        {/* Handle bar (already rendered by DrawerContent, but keep explicit header below) */}

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pb-4 border-b border-border shrink-0">
          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="Previous lead"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next lead"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Lead name (DrawerTitle for accessibility) */}
          <DrawerTitle className="flex-1 text-center text-base font-semibold truncate">
            {fullName}
          </DrawerTitle>

          {/* Star / Flag / Close */}
          <div className="flex items-center gap-1">
            {lead && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleStar(lead.id)}
                  aria-label={lead.is_starred ? 'Unstar lead' : 'Star lead'}
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
                  className="h-8 w-8"
                  onClick={() => onToggleFlag(lead.id)}
                  aria-label={lead.is_flagged ? 'Unflag lead' : 'Flag lead'}
                >
                  <Flag
                    className={`h-4 w-4 ${
                      lead.is_flagged
                        ? 'fill-red-500 text-red-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        {lead && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* Section 1: Contact */}
            <Section title="Contact">
              <FieldRow label="Name" value={fullName !== 'Unknown Lead' ? fullName : null} />
              <FieldRow label="Phone" value={lead.phone} copyable />
              <FieldRow label="Email" value={lead.email} copyable />
              <FieldRow label="Address" value={lead.address} copyable />
            </Section>

            {/* Section 2: Metadata */}
            <Section title="Details">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground shrink-0 w-24">Client</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {lead.client_slug}
                  </Badge>
                  {lead.is_duplicate && (
                    <Badge variant="destructive" className="text-xs">
                      Duplicate
                    </Badge>
                  )}
                </div>
              </div>
              <FieldRow label="Received" value={receivedFormatted} />
              <FieldRow label="Survey Ver." value={lead.survey_version} />
              {lead.is_duplicate && lead.duplicate_match_id && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground shrink-0 w-24 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Match ID
                  </span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-mono text-right break-all text-muted-foreground">
                      {lead.duplicate_match_id}
                    </span>
                    <CopyButton text={lead.duplicate_match_id} />
                  </div>
                </div>
              )}
            </Section>

            {/* Section 3: Survey Answers */}
            <Section title="Survey Answers">
              {surveyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No survey data</p>
              ) : (
                <div className="space-y-2">
                  {surveyEntries.map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4"
                    >
                      <span className="text-sm text-muted-foreground shrink-0 w-36">
                        {titleCase(key)}
                      </span>
                      <span className="text-sm text-right break-all">
                        {formatSurveyValue(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
