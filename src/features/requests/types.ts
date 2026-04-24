export type Direction = 'incoming' | 'outgoing'

export type InvoiceRequest = {
  requestId: `0x${string}`
  counterparty: `0x${string}`
  amount: bigint
  notes: string
  direction: Direction
  fulfilledVault?: `0x${string}`
  rejected?: boolean
}

export type TabKey = 'pending' | 'completed'
