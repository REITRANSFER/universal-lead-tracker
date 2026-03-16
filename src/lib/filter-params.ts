import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
} from 'nuqs/server'

/**
 * nuqs parser definitions shared between server and client components.
 * Use these to parse URL search params consistently across the app.
 *
 * Example (server):
 *   import { filterParams } from '@/lib/filter-params'
 *   const { clients, from, to, q } = filterParams
 *
 * Example (client hook):
 *   const [clients, setClients] = useQueryState('clients', filterParams.clients)
 */
export const filterParams = {
  /** Selected client slugs for filtering (multi-select) */
  clients: parseAsArrayOf(parseAsString).withDefault([]),
  /** Start of date range (ISO 8601) */
  from: parseAsIsoDateTime,
  /** End of date range (ISO 8601) */
  to: parseAsIsoDateTime,
  /** Full-text search query */
  q: parseAsString.withDefault(''),
}
