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
  createdAt: string
  fulfilledInvoice: { vault: `0x${string}` } | null
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
