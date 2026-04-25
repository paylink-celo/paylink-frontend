export type Invoice = {
  vault: `0x${string}`
  creator: `0x${string}`
  totalAmount: bigint
  totalCollected: bigint
  dueDate: bigint
  createdAt: bigint
  status: number
  role: 'sent' | 'received'
}

export type Tone = 'success' | 'neutral' | 'warning'

export type ActivityItem = {
  vault: `0x${string}`
  title: string
  counterparty: `0x${string}`
  amount: bigint
  direction: 'in' | 'out'
  status: number
  statusLabel: string
  tone: Tone
  icon: 'invoice' | 'receipt' | 'pending'
}
