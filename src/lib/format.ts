import { formatUnits, parseUnits } from 'viem'

export const DECIMALS = 18

export function formatAmount(value: bigint | string | number | undefined, decimals = DECIMALS): string {
  if (value === undefined || value === null) return '0.00'
  const bi = typeof value === 'bigint' ? value : BigInt(value)
  const asStr = formatUnits(bi, decimals)
  const num = Number(asStr)
  if (Number.isNaN(num)) return asStr
  return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

export function parseAmount(input: string, decimals = DECIMALS): bigint {
  return parseUnits(input as `${number}`, decimals)
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`
}

export function formatDate(timestamp: bigint | number | undefined): string {
  if (!timestamp) return '—'
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const STATUS_LABELS = [
  'Pending',
  'Partial',
  'Funded',
  'Settled',
  'Disputed',
  'Cancelled',
  'Expired',
] as const

export const STATUS_COLORS = [
  'status-pending',
  'status-partial',
  'status-funded',
  'status-settled',
  'status-disputed',
  'status-cancelled',
  'status-expired',
] as const

export function statusLabel(status: number): string {
  return STATUS_LABELS[status] ?? 'Unknown'
}

export function statusColor(status: number): string {
  return STATUS_COLORS[status] ?? 'status-cancelled'
}

export function isActiveStatus(status: number): boolean {
  return status === 0 || status === 1 || status === 2
}
