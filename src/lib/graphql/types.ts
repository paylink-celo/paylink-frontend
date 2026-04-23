export type Page<T> = { items: T[] }

export type SgInvoice = {
  id: `0x${string}`
  vault: `0x${string}`
  creator: `0x${string}`
  token: `0x${string}`
  totalAmount: string
  totalCollected: string
  dueDate: string
  status:
    | 'PENDING'
    | 'PARTIAL'
    | 'FUNDED'
    | 'SETTLED'
    | 'DISPUTED'
    | 'CANCELLED'
    | 'EXPIRED'
  metadataURI: string
  isOpenPayment: boolean
}

export type SgInvoiceRequest = {
  id: `0x${string}`
  requester: `0x${string}`
  counterparty: `0x${string}`
  amount: string
  notes: string
  fulfilled: boolean
  rejected: boolean
  rejectedAt: string | null
  rejectReason: string | null
  rejectedBy: `0x${string}` | null
  createdAt: string
  /**
   * When the counterparty accepts the request, the factory creates a vault
   * and the subgraph links it here. We inline just the subset of invoice
   * fields the requests UI needs to know whether the requester (now the
   * payer) still has to settle.
   */
  fulfilledInvoice: {
    vault: `0x${string}`
    status: SgInvoice['status']
    token: `0x${string}`
    totalAmount: string
    totalCollected: string
  } | null
}

export type SgPolicySetting = {
  id: string
  payer: `0x${string}`
  maxPerTx: string
  maxPerDay: string
  expiresAt: string
  minReputation: number
  useWhitelist: boolean
  active: boolean
  dayStart: string
  spentToday: string
  updatedAt: string
}

export type SgCreatorPermission = {
  id: string
  payer: `0x${string}`
  creator: `0x${string}`
  allowed: boolean
  blocked: boolean
  updatedAt: string
}

export type SgPolicySpend = {
  id: string
  payer: `0x${string}`
  creator: `0x${string}`
  amount: string
  spentTodayAfter: string
  timestamp: string
  txHash: `0x${string}`
}

const STATUS_MAP: Record<SgInvoice['status'], number> = {
  PENDING: 0,
  PARTIAL: 1,
  FUNDED: 2,
  SETTLED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
}

export function statusFromSubgraph(s: SgInvoice['status']): number {
  return STATUS_MAP[s] ?? 0
}
