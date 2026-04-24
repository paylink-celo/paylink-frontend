import { useEffect, useMemo, useState } from 'react'
import { useChainId, useConnection, usePublicClient } from 'wagmi'
import { toast } from 'sonner'

import { getAddresses } from '@/lib/addresses/addresses'
import { hasSubgraph } from '@/lib/graphql/client'
import { statusFromSubgraph } from '@/lib/graphql/types'
import { useInvoiceRequestsByUser } from '@/hooks/graphql/use-invoice-requests-by-user'

import { loadRequestsOnChain } from './loader'
import type { InvoiceRequest } from './types'

export function useRequests(): {
  rows: InvoiceRequest[]
  loading: boolean
} {
  const { address } = useConnection()
  const chainId = useChainId()
  const client = usePublicClient({ chainId })
  const addrs = getAddresses(chainId)

  // Fast path: subgraph via shared GraphQL hook.
  const sg = useInvoiceRequestsByUser()

  const subgraphRows = useMemo<InvoiceRequest[]>(() => {
    if (!sg.data) return []
    const rows: InvoiceRequest[] = []
    const mapFulfilled = (fi: (typeof sg.data.incoming)[number]['fulfilledInvoice']) =>
      fi
        ? {
            vault: fi.vault,
            status: statusFromSubgraph(fi.status),
            token: fi.token,
            totalAmount: BigInt(fi.totalAmount),
            totalCollected: BigInt(fi.totalCollected),
          }
        : undefined
    for (const sr of sg.data.incoming) {
      rows.push({
        requestId: sr.id,
        counterparty: sr.requester,
        amount: BigInt(sr.amount),
        notes: sr.notes,
        direction: 'incoming',
        fulfilledVault: sr.fulfilledInvoice?.vault,
        fulfilledInvoice: mapFulfilled(sr.fulfilledInvoice),
        rejected: sr.rejected,
        rejectedAt: sr.rejectedAt ? Number(sr.rejectedAt) : undefined,
        rejectReason: sr.rejectReason ?? undefined,
      })
    }
    for (const sr of sg.data.outgoing) {
      rows.push({
        requestId: sr.id,
        counterparty: sr.counterparty,
        amount: BigInt(sr.amount),
        notes: sr.notes,
        direction: 'outgoing',
        fulfilledVault: sr.fulfilledInvoice?.vault,
        fulfilledInvoice: mapFulfilled(sr.fulfilledInvoice),
        rejected: sr.rejected,
        rejectedAt: sr.rejectedAt ? Number(sr.rejectedAt) : undefined,
        rejectReason: sr.rejectReason ?? undefined,
      })
    }
    return rows
  }, [sg.data])

  // Slow path: direct on-chain events when no subgraph is configured.
  const [onChain, setOnChain] = useState<InvoiceRequest[]>([])
  const [onChainLoading, setOnChainLoading] = useState(false)

  useEffect(() => {
    if (!address || hasSubgraph()) return
    if (!client || !addrs.factory) return
    let cancelled = false
    const run = async () => {
      setOnChainLoading(true)
      try {
        const r = await loadRequestsOnChain(client, addrs.factory as `0x${string}`, address)
        if (!cancelled) setOnChain(r)
      } catch (e) {
        if (!cancelled) toast.error('Failed: ' + String(e))
      } finally {
        if (!cancelled) setOnChainLoading(false)
      }
    }
    queueMicrotask(run)
    return () => {
      cancelled = true
    }
  }, [client, address, addrs.factory])

  if (hasSubgraph()) {
    return { rows: subgraphRows, loading: sg.isLoading }
  }
  return { rows: onChain, loading: onChainLoading }
}
