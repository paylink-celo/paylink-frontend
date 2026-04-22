import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'

import { formatAmount, truncateAddress } from '@/lib/format'
import { getInvoiceActivity, type ActivityEvent } from '@/lib/api'

import { formatTs, humanizeEvent } from './helpers'

export function ActivityTimeline({ vaultAddr }: { vaultAddr: `0x${string}` }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const r = await getInvoiceActivity(vaultAddr)
        if (!cancelled) setEvents(r)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed')
      }
    }
    queueMicrotask(run)
    return () => {
      cancelled = true
    }
  }, [vaultAddr])

  return (
    <section className="island-shell rounded-2xl p-5 mt-4">
      <p className="island-kicker mb-2 flex items-center gap-1">
        <Receipt size={12} /> Activity
      </p>
      {error && <p className="m-0 text-sm text-[var(--status-expired)]">{error}</p>}
      {!error && events === null && (
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">Loading activity…</p>
      )}
      {events && events.length === 0 && (
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">No events yet.</p>
      )}
      {events && events.length > 0 && (
        <ul className="m-0 flex flex-col gap-3 p-0 list-none">
          {events.map((ev, i) => (
            <li key={`${ev.type}-${ev.ts}-${i}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {humanizeEvent(ev.type)}
                </p>
                <p className="mt-0.5 m-0 text-xs text-[var(--sea-ink-soft)]">
                  {formatTs(ev.ts)}
                  {ev.actor ? ` · ${truncateAddress(ev.actor as `0x${string}`)}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {ev.amount && (
                  <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                    {formatAmount(ev.amount)}
                  </p>
                )}
                {ev.explorerTx && (
                  <a
                    href={ev.explorerTx}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[var(--lagoon-deep)]"
                  >
                    View tx ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
