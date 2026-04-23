import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConnection } from 'wagmi'

import { graphClient, hasSubgraph } from '@/lib/graphql/client'
import type { Page, SgInvoice } from '@/lib/graphql/types'
import { statusFromSubgraph } from '@/lib/graphql/types'

/**
 * One pending obligation where the connected wallet is a payer.
 *
 * `amountDue` is the payer's personal remaining balance (drives the "you owe
 * X" copy). The vault-level `totalAmount/totalCollected` are kept for context
 * and grouping totals.
 */
export type ToPayItem = {
  vault: `0x${string}`
  creator: `0x${string}`
  token: `0x${string}`
  tokenSymbol: 'cUSD' | 'USDT' | 'token'
  totalAmount: bigint
  totalCollected: bigint
  amountDue: bigint // personal: payerRow.amountDue - payerRow.amountPaid
  dueDate: number // unix seconds
  status: number
  urgency: 'overdue' | 'dueSoon' | 'future'
  daysUntilDue: number // negative = overdue
}

export type ToPaySummary = {
  items: ToPayItem[]
  count: number
  overdueCount: number
  dueSoonCount: number
  totalsByToken: Array<{ token: `0x${string}`; symbol: ToPayItem['tokenSymbol']; amount: bigint }>
  isLoading: boolean
  error: Error | null
}

// Known token addresses → symbol. Duplicated from features/pay/helpers.ts to
// keep this hook self-contained. Update when adding new supported tokens.
function tokenSymbol(addr: string): ToPayItem['tokenSymbol'] {
  const lower = addr.toLowerCase()
  if (
    lower === '0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b' ||
    lower === '0x765de816845861e75a25fca122bb6898b8b1282a'
  ) {
    return 'cUSD'
  }
  if (
    lower === '0xd077a400968890eacc75cdc901f0356c943e4fdb' ||
    lower === '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e'
  ) {
    return 'USDT'
  }
  return 'token'
}

// Raw GraphQL shape — the `payers` table carries per-wallet balances and a
// nested invoice object with the shared fields.
type SgPayerEntry = {
  amountDue: string
  amountPaid: string
  invoice: SgInvoice | null
}

// A single decline record keyed by `<vault>-<payer>`.
type SgDeclineEntry = { invoiceId: `0x${string}` }

const QUERY = /* GraphQL */ `
  query ($user: String!) {
    received: payers(where: { payer: $user }, limit: 100) {
      items {
        amountDue
        amountPaid
        invoice {
          id
          vault
          creator
          token
          totalAmount
          totalCollected
          dueDate
          status
          metadataURI
          isOpenPayment
        }
      }
    }
    # All invoices this user has declined. We filter client-side rather than
    # join in GraphQL because Ponder's relations don't expose an easy
    # NOT EXISTS path.
    declines: invoiceDeclines(where: { payer: $user }, limit: 200) {
      items { invoiceId }
    }
  }
`

async function fetchToPay(
  user: `0x${string}`,
): Promise<{ entries: SgPayerEntry[]; declined: Set<string> }> {
  const data = await graphClient<{
    received: Page<SgPayerEntry>
    declines: Page<SgDeclineEntry>
  }>(QUERY, { user: user.toLowerCase() })
  return {
    entries: data.received?.items ?? [],
    declined: new Set((data.declines?.items ?? []).map((d) => d.invoiceId.toLowerCase())),
  }
}

/**
 * Get the connected wallet's pending payment obligations.
 *
 * Classification rules:
 *   - Vault status must be PENDING (0) or PARTIAL (1).
 *   - The payer's personal `amountDue - amountPaid` must be > 0
 *     (so fully-paid payers in multi-payer invoices are not surfaced).
 *
 * Sort order: by `dueDate` ascending — most urgent first.
 */
export function useMyToPay(): ToPaySummary {
  const { address } = useConnection()

  const q = useQuery({
    queryKey: ['my-to-pay', address?.toLowerCase()],
    queryFn: () => fetchToPay(address!),
    enabled: Boolean(address && hasSubgraph()),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })

  return useMemo<ToPaySummary>(() => {
    const now = Math.floor(Date.now() / 1000)
    const items: ToPayItem[] = []
    const entries = q.data?.entries ?? []
    const declined = q.data?.declined ?? new Set<string>()

    for (const row of entries) {
      if (!row.invoice) continue
      const status = statusFromSubgraph(row.invoice.status)
      if (status !== 0 && status !== 1) continue
      // Skip invoices this wallet has already declined — we don't want them to
      // resurface in "bills to pay" nudges after the user explicitly refused.
      if (declined.has(row.invoice.id.toLowerCase())) continue
      const personalDue = safeBigInt(row.amountDue) - safeBigInt(row.amountPaid)
      if (personalDue <= 0n) continue

      const dueDate = Number(row.invoice.dueDate)
      const daysUntilDue = Math.floor((dueDate - now) / 86_400)
      const urgency: ToPayItem['urgency'] =
        daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 3 ? 'dueSoon' : 'future'

      items.push({
        vault: row.invoice.vault,
        creator: row.invoice.creator,
        token: row.invoice.token,
        tokenSymbol: tokenSymbol(row.invoice.token),
        totalAmount: safeBigInt(row.invoice.totalAmount),
        totalCollected: safeBigInt(row.invoice.totalCollected),
        amountDue: personalDue,
        dueDate,
        status,
        urgency,
        daysUntilDue,
      })
    }

    items.sort((a, b) => a.dueDate - b.dueDate)

    // Aggregate totals per token symbol so the UI can show e.g. "3 USDT + 5 cUSD".
    const bucket = new Map<string, { token: `0x${string}`; amount: bigint }>()
    for (const it of items) {
      const key = it.tokenSymbol
      const cur = bucket.get(key)
      bucket.set(key, {
        token: it.token,
        amount: (cur?.amount ?? 0n) + it.amountDue,
      })
    }
    const totalsByToken = Array.from(bucket).map(([symbol, v]) => ({
      token: v.token,
      symbol: symbol as ToPayItem['tokenSymbol'],
      amount: v.amount,
    }))

    return {
      items,
      count: items.length,
      overdueCount: items.filter((x) => x.urgency === 'overdue').length,
      dueSoonCount: items.filter((x) => x.urgency === 'dueSoon').length,
      totalsByToken,
      isLoading: q.isLoading,
      error: q.error instanceof Error ? q.error : null,
    }
  }, [q.data, q.isLoading, q.error])
}

function safeBigInt(v: string | null | undefined): bigint {
  try {
    return BigInt(v ?? '0')
  } catch {
    return 0n
  }
}
