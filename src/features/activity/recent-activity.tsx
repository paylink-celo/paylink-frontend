import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useChainId, useConnection } from 'wagmi'

import { EmptyCard } from '@/components/empty-card'
import { getAddresses } from '@/lib/addresses/addresses'

import { ActivityRow } from './activity-row'
import { toActivityItem } from './helpers'
import { useInvoices } from './use-invoices'
import type { ActivityItem } from './types'

export function RecentActivity() {
  const { address } = useConnection()
  const chainId = useChainId()
  const { factory } = getAddresses(chainId)
  const { invoices, loading, error } = useInvoices()

  const items = useMemo<ActivityItem[]>(() => invoices.map(toActivityItem), [invoices])

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="display-title text-xl font-bold text-[var(--sea-ink)]">Recent Activity</h2>
        <Link to="/activity" className="text-sm font-semibold text-[var(--lagoon-deep)]">
          View All
        </Link>
      </div>

      {!address && <EmptyCard title="Getting ready" body="Connecting to your MiniPay wallet…" />}
      {address && !factory && (
        <EmptyCard title="Not available yet" body="PayLink is being set up. Please try again later." />
      )}
      {loading && <p className="text-base text-[var(--sea-ink-soft)]">Loading activity…</p>}
      {error && (
        <p className="text-base text-[var(--status-expired)]" role="alert">
          Something went wrong. Please try again.
        </p>
      )}

      {items.length > 0 && (
        <div className="grid gap-3">
          {items.map((it) => (
            <ActivityRow key={it.vault} item={it} />
          ))}
        </div>
      )}

      {address && factory && !loading && items.length === 0 && !error && (
        <EmptyCard
          title="No activity yet"
          body="Your incoming and outgoing invoices will appear here."
        />
      )}
    </section>
  )
}
