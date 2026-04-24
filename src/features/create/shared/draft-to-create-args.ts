import type { AiDraft } from '@/lib/api'
import type { ChainAddresses } from '@/lib/addresses/addresses'
import { TOKEN_DECIMALS } from '@/hooks/balance/use-token-balance'
import { parseAmount } from '@/lib/format'

export const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/u

/** +7 days fallback for "auto-bumped" due dates. */
export const DEFAULT_DUE_DAYS = 7

/**
 * Bump an LLM-produced due date that lands on today or in the past to
 * (now + DEFAULT_DUE_DAYS). Returns the possibly-updated draft plus a flag
 * so callers can show an "(auto-set +7d)" label in the UI.
 */
export function normaliseDueDate(draft: AiDraft): { draft: AiDraft; bumped: boolean } {
  const parsed = Date.parse(draft.dueDateIso)
  const isPastOrToday = !parsed || parsed <= Date.now()
  if (!isPastOrToday) return { draft, bumped: false }
  const dueDateIso = new Date(Date.now() + DEFAULT_DUE_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10)
  return { draft: { ...draft, dueDateIso }, bumped: true }
}

export type CreateInvoiceArgs = {
  tokenAddr: `0x${string}`
  totalWei: bigint
  dueTs: bigint
  allowedPayers: `0x${string}`[]
  payerAmounts: bigint[]
  isOpen: boolean
}

/**
 * Convert an `AiDraft` into the positional argument tuple expected by
 * `InvoiceFactory.createInvoice(...)`.
 *
 * Classification rule: if the draft carries at least one valid payer address,
 * produce a restricted invoice (`isOpen=false`). Otherwise produce an
 * open-payment invoice (`isOpen=true`) — this is the "agent" mode where any
 * wallet can deposit.
 *
 * Throws a user-facing Error on malformed input (missing amount, bad token,
 * etc.) so callers can surface the message in a toast without further
 * processing.
 */
export function buildCreateArgs(draft: AiDraft, addrs: ChainAddresses): CreateInvoiceArgs {
  const amountOk = /^\d+(\.\d{1,18})?$/u.test(draft.amount) && Number(draft.amount) > 0
  const validPayers = draft.payers.filter((p) => ADDRESS_RE.test(p.address))
  const isOpen = validPayers.length === 0

  if (isOpen && !amountOk) {
    throw new Error('Amount missing. Re-phrase with a number, e.g. "5 USDT".')
  }

  let totalWei: bigint
  let allowedPayers: `0x${string}`[] = []
  let payerAmounts: bigint[] = []
  // Token-specific on-chain scale (USDT=6, cUSD=18).
  const decimals = TOKEN_DECIMALS[draft.token] ?? 18
  try {
    if (isOpen) {
      totalWei = parseAmount(draft.amount, decimals)
    } else {
      allowedPayers = validPayers.map((p) => p.address as `0x${string}`)
      payerAmounts = validPayers.map((p) => parseAmount(p.amount || draft.amount || '0', decimals))
      totalWei = payerAmounts.reduce((a, b) => a + b, 0n)
    }
  } catch {
    throw new Error('Invalid amount. Re-phrase with a valid number.')
  }
  if (totalWei <= 0n) throw new Error('Total amount must be > 0.')

  const tokenAddr = (draft.token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`
  if (!tokenAddr) throw new Error('Token not configured on this chain.')

  const parsedDue = Date.parse(draft.dueDateIso)
  if (!parsedDue) throw new Error('Invalid due date.')
  const dueTs = BigInt(Math.floor(parsedDue / 1000))

  return { tokenAddr, totalWei, dueTs, allowedPayers, payerAmounts, isOpen }
}
