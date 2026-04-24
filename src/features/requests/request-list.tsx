import { useMemo, useState } from 'react'
import { useChainId, useConnection } from 'wagmi'

import { EmptyCard } from '@/components/empty-card'
import { getAddresses } from '@/lib/addresses/addresses'

import { RequestCard } from './request-card'
import { RequestCardSkeleton } from './request-card-skeleton'
import { useRequests } from './use-requests'
import type { InvoiceRequest, TabKey } from './types'

const LOADING_SKELETONS = 3

/**
 * A fulfilled outgoing request where the current user still owes payment.
 * Flagged separately so the UI can show a counter badge and sort these rows
 * to the top of the Accepted tab.
 */
function isActionNeeded(r: InvoiceRequest): boolean {
  if (r.direction !== 'outgoing') return false
  if (!r.fulfilledVault) return false
  if (!r.fulfilledInvoice) return true // unknown status → assume user needs to act
  return r.fulfilledInvoice.status === 0 || r.fulfilledInvoice.status === 1
}

export function RequestList() {
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)
  const { rows, loading } = useRequests()

  const [tab, setTab] = useState<TabKey>('pending')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleRows = useMemo(
    () => rows.filter((r) => !dismissed.has(r.requestId)),
    [rows, dismissed],
  )
  const pending = useMemo(
    () => visibleRows.filter((r) => !r.fulfilledVault && !r.rejected),
    [visibleRows],
  )
  // "Accepted" now carries both fully-paid and action-needed fulfilled rows.
  // Action-needed rows are sorted first so the user sees them before the
  // passive "paid" history.
  const accepted = useMemo(() => {
    const fulfilled = visibleRows.filter((r) => r.fulfilledVault)
    return [...fulfilled].sort((a, b) => {
      const aActive = isActionNeeded(a) ? 0 : 1
      const bActive = isActionNeeded(b) ? 0 : 1
      return aActive - bActive
    })
  }, [visibleRows])
  const rejected = useMemo(
    () => visibleRows.filter((r) => r.rejected && !r.fulfilledVault),
    [visibleRows],
  )
  const actionNeededCount = useMemo(
    () => accepted.filter(isActionNeeded).length,
    [accepted],
  )

  const activeList = tab === 'pending' ? pending : tab === 'accepted' ? accepted : rejected

  return (
    <>
      {actionNeededCount > 0 && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#F8DDD4] bg-[#FDEAE1] px-4 py-3"
          role="alert"
        >
          <div>
            <p className="m-0 text-sm font-semibold text-[#A4463A]">
              {actionNeededCount} request{actionNeededCount === 1 ? '' : 's'} waiting for your payment
            </p>
            <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
              Your request was accepted on-chain — open the invoice to settle it.
            </p>
          </div>
          <button
            type="button"
            className="request-btn request-btn--primary"
            onClick={() => setTab('accepted')}
          >
            View
          </button>
        </div>
      )}

      <div className="segmented mb-5" role="tablist" aria-label="Request status">
        {([
          ['pending', 'Pending', pending.length],
          ['accepted', 'Accepted', accepted.length],
          ['rejected', 'Rejected', rejected.length],
        ] as const).map(([k, label, n]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`segmented-item ${tab === k ? 'segmented-item--active' : ''}`}
          >
            {label}
            {n > 0 && (
              <span className="ml-1 text-xs font-semibold text-[var(--sea-ink-soft)]">
                {n}
              </span>
            )}
            {k === 'accepted' && actionNeededCount > 0 && (
              <span
                className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9564A] px-1 text-[10px] font-bold text-white"
                aria-label={`${actionNeededCount} action needed`}
              >
                {actionNeededCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {!address && (
        <p className="text-base text-[var(--sea-ink-soft)]">Connecting to your wallet…</p>
      )}

      {address && loading && (
        <div className="grid gap-4" aria-busy aria-label="Loading requests">
          {Array.from({ length: LOADING_SKELETONS }).map((_, i) => (
            <RequestCardSkeleton key={i} />
          ))}
        </div>
      )}

      {address && !loading && activeList.length === 0 && (
        <EmptyCard
          title={
            tab === 'pending'
              ? 'No pending requests'
              : tab === 'accepted'
                ? 'No accepted requests yet'
                : 'No rejected requests'
          }
          body={
            tab === 'pending'
              ? 'You\u2019re all caught up for now.'
              : tab === 'accepted'
                ? 'Accepted requests will appear here. The ones you still need to pay are flagged.'
                : 'Rejected incoming requests will appear here.'
          }
        />
      )}

      <div className="grid gap-4">
        {activeList.map((r) => (
          <RequestCard
            key={r.requestId}
            req={r}
            factory={addrs.factory as `0x${string}`}
            cUSD={addrs.cUSD as `0x${string}`}
            onDismiss={(id) => setDismissed((s) => new Set(s).add(id))}
          />
        ))}
      </div>
    </>
  )
}
