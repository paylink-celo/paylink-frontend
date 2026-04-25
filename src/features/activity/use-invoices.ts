import { useEffect, useMemo, useState } from 'react'
import { useChainId, useConnection, usePublicClient } from 'wagmi'

import { getAddresses } from '@/lib/addresses/addresses'
import { hasSubgraph } from '@/lib/graphql/client'
import { statusFromSubgraph } from '@/lib/graphql/types'
import { useInvoicesByUser } from '@/hooks/graphql/use-invoices-by-user'

import { loadInvoicesOnChain } from './loader'
import type { Invoice } from './types'

export function useInvoices(): {
  invoices: Invoice[]
  loading: boolean
  error: string | null
} {
  const { address } = useConnection()
  const chainId = useChainId()
  const client = usePublicClient({ chainId })
  const { factory } = getAddresses(chainId)

  // Fast path: subgraph via shared GraphQL hook.
  const { data: sgData, isLoading: sgLoading, error: sgError } = useInvoicesByUser()

  const subgraphInvoices = useMemo<Invoice[]>(() => {
    if (!sgData) return []
    const seen = new Set<string>()
    const rows: Invoice[] = []
    const push = (role: 'sent' | 'received', key: string, inv: (typeof sgData)['sent'][number]) => {
      if (seen.has(key)) return
      seen.add(key)
      rows.push({
        vault: inv.vault,
        creator: inv.creator,
        totalAmount: BigInt(inv.totalAmount),
        totalCollected: BigInt(inv.totalCollected),
        dueDate: BigInt(inv.dueDate),
        createdAt: BigInt(inv.createdAt ?? inv.dueDate),
        status: statusFromSubgraph(inv.status),
        role,
      })
    }
    for (const inv of sgData.sent) push('sent', inv.vault.toLowerCase(), inv)
    for (const inv of sgData.received) push('received', inv.vault.toLowerCase(), inv)
    rows.sort((a, b) => Number(b.createdAt - a.createdAt))
    return rows
  }, [sgData])

  // Slow path: direct on-chain fallback when no subgraph is configured.
  const [onChain, setOnChain] = useState<Invoice[]>([])
  const [onChainLoading, setOnChainLoading] = useState(false)
  const [onChainError, setOnChainError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || hasSubgraph()) return
    if (!factory || !client) return
    let cancelled = false
    const run = async () => {
      setOnChainLoading(true)
      setOnChainError(null)
      try {
        const rows = await loadInvoicesOnChain(client, factory as `0x${string}`, address)
        if (!cancelled) setOnChain(rows)
      } catch (e) {
        if (!cancelled) setOnChainError(String(e))
      } finally {
        if (!cancelled) setOnChainLoading(false)
      }
    }
    queueMicrotask(run)
    return () => {
      cancelled = true
    }
  }, [address, factory, client])

  if (hasSubgraph()) {
    return {
      invoices: subgraphInvoices,
      loading: sgLoading,
      error: sgError ? sgError.message : null,
    }
  }
  return {
    invoices: onChain,
    loading: onChainLoading,
    error: onChainError,
  }
}
