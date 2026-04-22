import { formatAmount, parseAmount } from '@/lib/format'

export function tokenLabel(addr: `0x${string}` | undefined): 'cUSD' | 'USDT' | 'token' {
  if (!addr) return 'token'
  const lower = addr.toLowerCase()
  if (lower === '0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b') return 'cUSD'
  if (lower === '0xd077a400968890eacc75cdc901f0356c943e4fdb') return 'USDT'
  if (lower === '0x765de816845861e75a25fca122bb6898b8b1282a') return 'cUSD'
  if (lower === '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e') return 'USDT'
  return 'token'
}

export function humanizeEvent(type: string): string {
  switch (type) {
    case 'Deposited': return 'Payment received'
    case 'Released': return 'Funds released to creator'
    case 'Refunded': return 'Payer refunded'
    case 'X402PaymentReceived': return 'Agent paid via x402'
    case 'Cancelled': return 'Invoice cancelled'
    case 'Created': return 'Invoice created'
    case 'InvoiceDeclined': return 'Payer declined invoice'
    case 'Disputed': return 'Invoice disputed'
    case 'Expired': return 'Invoice expired'
    case 'DelegateSet': return 'Delegate payer set'
    case 'PayerAdded': return 'Payer added'
    case 'OpenPaymentChanged': return 'Open-payment toggled'
    default: return type
  }
}

export function formatTs(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleString()
}

export function asInput(v: bigint): string {
  const s = formatAmount(v).replace(/,/g, '')
  return s === '0.00' ? '' : s
}

export function parseInput(v: string): bigint {
  if (!v) return 0n
  try {
    return parseAmount(v)
  } catch {
    return 0n
  }
}
