export type Direction = 'incoming' | 'outgoing'

/**
 * Snapshot of the invoice that was created when a request was accepted.
 * Present only when the subgraph is available (the on-chain fallback only
 * knows `vault`).
 */
export type FulfilledInvoice = {
  vault: `0x${string}`
  status: number // 0 PENDING, 1 PARTIAL, 2 FUNDED, 3 SETTLED, 4 DISPUTED, 5 CANCELLED, 6 EXPIRED
  token: `0x${string}`
  totalAmount: bigint
  totalCollected: bigint
}

export type InvoiceRequest = {
  requestId: `0x${string}`
  counterparty: `0x${string}`
  amount: bigint
  notes: string
  direction: Direction
  /** Convenience: vault address alone for the on-chain fallback path. */
  fulfilledVault?: `0x${string}`
  /** Rich invoice state — subgraph only. */
  fulfilledInvoice?: FulfilledInvoice
  // Rejection state mirrored from the subgraph. Subgraph populates these
  // after an InvoiceRequestRejected event; the on-chain fallback leaves them
  // undefined and relies on the local UI hiding the row.
  rejected?: boolean
  rejectedAt?: number
  rejectReason?: string
}

export type TabKey = 'pending' | 'accepted' | 'rejected'
