import { formatUnits, parseUnits } from 'viem'

export function tokenLabel(addr: `0x${string}` | undefined): 'cUSD' | 'USDT' | 'token' {
  if (!addr) return 'token'
  const lower = addr.toLowerCase()
  if (lower === '0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b') return 'cUSD'
  if (lower === '0xd077a400968890eacc75cdc901f0356c943e4fdb') return 'USDT'
  if (lower === '0x765de816845861e75a25fca122bb6898b8b1282a') return 'cUSD'
  if (lower === '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e') return 'USDT'
  return 'token'
}

/**
 * On-chain decimals for each supported token. USDT on Celo uses 6 decimals
 * (matching the Ethereum USDT contract), while cUSD uses 18. Callers that
 * convert user input ⇄ bigint must pass the right scale or the amount will
 * be off by `10**12`.
 */
export function tokenDecimals(addr: `0x${string}` | undefined): number {
  switch (tokenLabel(addr)) {
    case 'USDT':
      return 6
    case 'cUSD':
      return 18
    default:
      return 18
  }
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

/**
 * Convert an on-chain balance to a raw input string (no thousands separators),
 * suitable for placing into a controlled `<input>` the user can edit.
 *
 * `decimals` MUST come from the token: 18 for cUSD, 6 for USDT, etc.
 */
export function asInput(v: bigint, decimals = 18): string {
  if (v === 0n) return ''
  return formatUnits(v, decimals)
}

/**
 * Parse a human-typed amount (e.g. "2.5") into a bigint with the given token
 * decimals. Returns `0n` on any parse failure so callers can validate before
 * submitting.
 */
export function parseInput(v: string, decimals = 18): bigint {
  if (!v) return 0n
  try {
    return parseUnits(v as `${number}`, decimals)
  } catch {
    return 0n
  }
}
