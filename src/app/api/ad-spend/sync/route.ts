import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

// ── ClickUp Config ─────────────────────────────────────────────────────
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN ?? 'pk_94206680_R9N31Q67UPPG85U83TC0MZRMABQ31Q8S'
const CLICKUP_LIST_ID = '901409858409'

// Custom field IDs
const FIELD_BUDGET = '6cd89079'
const FIELD_SPEND_7D = '634ad422'
const FIELD_CPL_7D = '666c2413'
const FIELD_LEADS_7D = 'e6fc2ae6'
const FIELD_RELAUNCH = '6b9a3707'

// Manual task name → slug overrides
const MANUAL_MAP: Record<string, string> = {
  '367 EHB Express Homebuyers': 'express-home-offers',
  '367 Express Homebuyers': 'express-home-offers',
  'EHB Express Homebuyers': 'express-home-offers',
  'Express Home Buyers': 'express-home-offers',
}

// ── Helpers ────────────────────────────────────────────────────────────

function extractNumber(text: string): number | null {
  // Match $7k, $1.5k, etc.
  const kMatch = text.match(/\$?([\d,]+\.?\d*)\s*k\b/i)
  if (kMatch) return parseFloat(kMatch[1].replace(/,/g, '')) * 1000

  const numMatch = text.match(/\$?([\d,]+\.?\d*)/)
  if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ''))

  return null
}

function parseDailyBudget(raw: string): number | null {
  if (!raw || !raw.trim()) return null
  const text = raw.trim()

  // If there's a pipe, check for explicit daily value after it
  if (text.includes('|')) {
    const parts = text.split('|')
    const afterPipe = parts[parts.length - 1].trim()
    if (/daily|\/day/i.test(afterPipe)) {
      const val = extractNumber(afterPipe)
      if (val !== null) return val
    }
    // Otherwise first part before pipe is the daily budget
    const beforePipe = parts[0].trim()
    const val = extractNumber(beforePipe)
    if (val !== null) return val
  }

  // Monthly values
  if (/\/pm|\/mo|\/month|monthly/i.test(text)) {
    const val = extractNumber(text)
    if (val !== null) return Math.round((val / 30) * 100) / 100
  }

  // Weekly values
  if (/\/pw|\/wk|\/week|weekly/i.test(text)) {
    const val = extractNumber(text)
    if (val !== null) return Math.round((val / 7) * 100) / 100
  }

  // Default: treat as daily
  return extractNumber(text)
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/,/g, ''))
    return isNaN(n) ? null : n
  }
  return null
}

function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  if (aLower === bLower) return 1

  // Word overlap score
  const aWords = new Set(aLower.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/))
  const bWords = new Set(bLower.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/))
  const intersection = [...aWords].filter((w) => bWords.has(w)).length
  const union = new Set([...aWords, ...bWords]).size
  return union > 0 ? intersection / union : 0
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\d+\s+/, '') // remove leading numbers
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function fuzzyMatchSlug(taskName: string, slugs: string[]): string | null {
  if (MANUAL_MAP[taskName] && slugs.includes(MANUAL_MAP[taskName])) {
    return MANUAL_MAP[taskName]
  }

  const slugForm = toSlug(taskName)
  if (slugs.includes(slugForm)) return slugForm

  let bestScore = 0
  let bestSlug: string | null = null
  for (const slug of slugs) {
    const score = Math.max(
      similarity(slugForm, slug),
      similarity(taskName, slug.replace(/-/g, ' '))
    )
    if (score > bestScore) {
      bestScore = score
      bestSlug = slug
    }
  }

  return bestScore >= 0.5 ? bestSlug : null
}

interface ClickUpCustomField {
  id: string
  value?: unknown
  text_value?: string
  type_config?: { options?: Array<{ orderindex: number; name: string }> }
}

interface ClickUpTask {
  name: string
  custom_fields?: ClickUpCustomField[]
}

/**
 * POST /api/ad-spend/sync
 *
 * Triggers a ClickUp → Supabase ad spend sync inline.
 */
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  try {
    // 1. Fetch all client slugs from Supabase
    const clientsRes = await supabaseRest('/rest/v1/clients?select=client_slug,name')
    if (!clientsRes.ok) throw new Error(`Supabase clients fetch failed: ${clientsRes.status}`)
    const clients: Array<{ client_slug: string; name: string | null }> = await clientsRes.json()
    const slugs = clients.map((c) => c.client_slug)
    const nameMap = new Map(clients.filter((c) => c.name).map((c) => [c.name!, c.client_slug]))

    // 2. Fetch tasks from ClickUp (paginated)
    const allTasks: ClickUpTask[] = []
    let page = 0
    while (true) {
      const cuRes = await fetch(
        `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task?page=${page}&include_closed=true&subtasks=true`,
        { headers: { Authorization: CLICKUP_API_TOKEN } }
      )
      if (!cuRes.ok) throw new Error(`ClickUp API error: ${cuRes.status}`)
      const cuData = await cuRes.json()
      const tasks = cuData.tasks ?? []
      if (tasks.length === 0) break
      allTasks.push(...tasks)
      if (cuData.last_page) break
      page++
    }

    // 3. Process each task
    let updated = 0
    let skipped = 0
    const noMatch: string[] = []
    const parseFailures: Array<{ name: string; raw: string }> = []
    const now = new Date().toISOString()

    for (const task of allTasks) {
      const fields = new Map((task.custom_fields ?? []).map((f) => [f.id, f]))

      const budgetField = fields.get(FIELD_BUDGET)
      const spendField = fields.get(FIELD_SPEND_7D)
      const cplField = fields.get(FIELD_CPL_7D)
      const leadsField = fields.get(FIELD_LEADS_7D)
      const relaunchField = fields.get(FIELD_RELAUNCH)

      // Get raw budget value
      let budgetRaw: unknown = budgetField?.value ?? budgetField?.text_value ?? null

      const spend7d = parseNumeric(spendField?.value ?? null)
      const cpl7d = parseNumeric(cplField?.value ?? null)
      const leads7dRaw = parseNumeric(leadsField?.value ?? null)
      const leads7d = leads7dRaw !== null ? Math.round(leads7dRaw) : null

      // Parse ad status from dropdown
      let adStatus: string | null = null
      if (relaunchField?.value !== undefined && relaunchField?.value !== null) {
        const options = relaunchField.type_config?.options ?? []
        for (const opt of options) {
          if (String(opt.orderindex) === String(relaunchField.value)) {
            adStatus = opt.name.toLowerCase()
            break
          }
        }
      }

      // Skip tasks with no data
      if (budgetRaw === null && spend7d === null && leads7d === null) continue

      // Parse daily budget
      let dailyBudget: number | null = null
      if (typeof budgetRaw === 'string') {
        dailyBudget = parseDailyBudget(budgetRaw)
        if (dailyBudget === null && budgetRaw.trim()) {
          parseFailures.push({ name: task.name, raw: budgetRaw })
        }
      } else if (typeof budgetRaw === 'number') {
        dailyBudget = budgetRaw
      }

      // Match to slug
      let slug = nameMap.get(task.name) ?? null
      if (!slug) slug = fuzzyMatchSlug(task.name, slugs)
      if (!slug) {
        noMatch.push(task.name)
        continue
      }

      // Build update
      const update: Record<string, unknown> = { budget_updated_at: now }
      if (dailyBudget !== null) update.daily_budget = dailyBudget
      if (spend7d !== null) update.spend_7d = spend7d
      if (cpl7d !== null) update.cpl_7d = cpl7d
      if (leads7d !== null) update.leads_7d = leads7d
      if (adStatus !== null) update.ad_status = adStatus

      // PATCH Supabase
      const patchRes = await supabaseRest(
        `/rest/v1/clients?client_slug=eq.${slug}`,
        {
          method: 'PATCH',
          body: JSON.stringify(update),
          headers: { Prefer: 'return=minimal' },
        }
      )

      if (patchRes.ok) {
        updated++
      } else {
        skipped++
      }
    }

    // TODO: Add Slack notification here for sync results
    // e.g., post to #lead-ops with summary of updated clients, parse failures, unmatched tasks

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      no_match: noMatch,
      parse_failures: parseFailures,
      total_tasks: allTasks.length,
      synced_at: now,
    })
  } catch (err) {
    console.error('[/api/ad-spend/sync] Error:', err)
    return NextResponse.json(
      { error: 'Sync failed', detail: String(err) },
      { status: 500 }
    )
  }
}
