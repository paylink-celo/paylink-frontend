import { useMemo, useState } from 'react'
import { useChainId, useConnection } from 'wagmi'

import { EmptyCard } from '@/components/empty-card'
import { getAddresses } from '@/lib/addresses/addresses'

import { RequestCard } from './request-card'
import { useRequests } from './use-requests'
import type { TabKey } from './types'

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
  const completed = useMemo(() => visibleRows.filter((r) => r.fulfilledVault), [visibleRows])
  const activeList = tab === 'pending' ? pending : completed

  return (
    <>
      <div className="segmented mb-5" role="tablist" aria-label="Request status">
        {([
          ['pending', 'Pending'],
          ['completed', 'Completed'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`segmented-item ${tab === k ? 'segmented-item--active' : ''}`}
          >
            {label}
          </button> 
        ))}
      </div>

      {!address && <p className="text-base text-(--sea-ink-soft)">Connecting to your wallet…</p>}
      {loading && <p className="text-base text-(--sea-ink-soft)">Loading requests…</p>}

      {address && !loading && activeList.length === 0 && (
        <EmptyCard
          title={tab === 'pending' ? 'No pending requests' : 'No completed requests yet'}
          body={
            tab === 'pending'
              ? 'You’re all caught up for now.'
              : 'Accepted and paid requests will appear here.'
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
