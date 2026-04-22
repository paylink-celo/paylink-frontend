import { backendFetch, backendUrl, hasBackend } from './backend'

export { backendUrl, hasBackend }

/** JSON helper that throws on non-2xx, with redacted error messages in prod. */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await backendFetch(path, init)
  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { /* ignore */ }
    const msg = (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
      ? (body as { error: string }).error
      : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return (await res.json()) as T
}

/* ---------- Invoice ---------- */

export type InvoiceStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'FUNDED'
  | 'SETTLED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'EXPIRED'

export type InvoiceRead = {
  vault: `0x${string}`
  creator: `0x${string}`
  token: `0x${string}`
  totalAmount: string
  totalCollected: string
  dueDate: string
  status: InvoiceStatus
  metadataURI: string
  isOpenPayment: boolean
}

export function getInvoice(vault: string): Promise<InvoiceRead> {
  return requestJson<InvoiceRead>(`/api/invoice/${vault}`)
}

export type ActivityEvent = {
  type: string
  ts: number
  actor?: string
  amount?: string
  txHash?: string
  explorerTx?: string
  [k: string]: unknown
}

export function getInvoiceActivity(vault: string): Promise<ActivityEvent[]> {
  return requestJson<ActivityEvent[]>(`/api/invoice/${vault}/activity`)
}

/** Build a direct link to the server-rendered invoice PDF. */
export function invoicePdfUrl(vault: string): string {
  return `${backendUrl}/api/pdf/${vault}`
}

/** x402 discovery URL for AI agents. */
export function x402PayUrl(vault: string): string {
  return `${backendUrl}/api/invoice/${vault}/pay`
}

/** Parsed x402 discovery response (HTTP 402 headers). */
export type X402Requirements = {
  amount: bigint
  currency: string
  token: `0x${string}`
  recipient: `0x${string}`
  chainId: number
  scheme: string
}

/**
 * Perform the `GET /api/invoice/:vault/pay` discovery call.
 *
 * The backend responds with `HTTP 402` plus `X-Payment-*` headers that
 * describe the EIP-3009 authorization the client must sign.
 */
export async function getX402Requirements(vault: string): Promise<X402Requirements> {
  const res = await backendFetch(`/api/invoice/${vault}/pay`)
  const amount = res.headers.get('X-Payment-Amount')
  const token = res.headers.get('X-Payment-Token')
  const recipient = res.headers.get('X-Payment-Recipient')
  const chain = res.headers.get('X-Payment-Chain')
  const scheme = res.headers.get('X-Payment-Scheme') ?? 'eip-3009'
  const currency = res.headers.get('X-Payment-Currency') ?? ''
  if (!amount || !token || !recipient || !chain) {
    throw new Error('Missing X-Payment-* headers from x402 discovery')
  }
  const chainId = Number(chain.split(':').pop())
  if (!Number.isFinite(chainId) || chainId <= 0) {
    throw new Error(`Invalid X-Payment-Chain: ${chain}`)
  }
  return {
    amount: BigInt(amount),
    currency,
    token: token as `0x${string}`,
    recipient: recipient as `0x${string}`,
    chainId,
    scheme,
  }
}

export type X402AuthPayload = {
  from: `0x${string}`
  value: string
  validAfter: string
  validBefore: string
  nonce: `0x${string}`
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

export type X402RelayResult = {
  txHash: `0x${string}`
  explorer?: string
}

/** Submit a signed EIP-3009 authorization. Backend relays `x402Pay()`. */
export function postX402Payment(
  vault: string,
  payload: X402AuthPayload,
): Promise<X402RelayResult> {
  return requestJson<X402RelayResult>(`/api/invoice/${vault}/pay`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/* ---------- Metadata pinning ---------- */

export type PinResult = {
  uri: string // ipfs://<cid> or data:application/json;base64,...
  cid?: string
}

export type PinPayload = {
  title?: string
  note?: string
  createdBy?: string
  tags?: string[]
  extra?: Record<string, unknown>
}

export function pinMetadata(payload: PinPayload): Promise<PinResult> {
  return requestJson<PinResult>('/api/metadata/pin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/* ---------- SocialConnect: phone → address ---------- */

export type PhoneResolution = {
  phone: string
  addresses: `0x${string}`[]
  issuers: `0x${string}`[]
}

export function resolvePhone(number: string): Promise<PhoneResolution> {
  const q = encodeURIComponent(number)
  return requestJson<PhoneResolution>(`/api/resolve/phone?number=${q}`)
}

/* ---------- AI ---------- */

export type AiDraftMode = 'push' | 'split' | 'pull' | 'agent'

export type AiDraft = {
  mode: AiDraftMode
  token: 'cUSD' | 'USDT'
  amount: string
  dueDateIso: string
  notes: string
  payers: Array<{ address: string; amount: string }>
  counterparty?: string
}

export function parseInvoice(input: string): Promise<{ draft: AiDraft; error?: string }> {
  return requestJson<{ draft: AiDraft; error?: string }>('/api/ai/parse-invoice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input }),
  })
}

/* ---------- Ops ---------- */

export type ReminderResult = { ok: boolean; count?: number; reminders?: unknown[] }

export function triggerReminders(): Promise<ReminderResult> {
  return requestJson<ReminderResult>('/api/cron/reminders')
}

/* ---------- Address helpers shared by Create flows ---------- */

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/u
const E164_RE = /^\+[1-9]\d{7,14}$/u

export function isEvmAddress(s: string): s is `0x${string}` {
  return ADDRESS_RE.test(s)
}

export function isPhoneNumber(s: string): boolean {
  return E164_RE.test(s.trim())
}

/**
 * Best-effort resolution for the "payer wallet" input used in Create.
 * Accepts:
 *   - raw 0x addresses (returned as-is)
 *   - E.164 phone numbers (resolved via /api/resolve/phone when backend is set)
 *   - @username handles (not yet supported — throws a clear error)
 */
export async function resolveRecipient(raw: string): Promise<`0x${string}`> {
  const value = raw.trim()
  if (!value) throw new Error('Enter a payer wallet')
  if (isEvmAddress(value)) return value
  if (isPhoneNumber(value)) {
    if (!hasBackend()) throw new Error('Phone lookup needs VITE_BACKEND_URL')
    const r = await resolvePhone(value)
    if (r.addresses.length === 0) throw new Error('No wallet found for this phone number')
    return r.addresses[0]
  }
  if (value.startsWith('@')) {
    throw new Error('Username lookup is not available yet — use a wallet address or phone number')
  }
  throw new Error('Use a 0x wallet address or an E.164 phone number (e.g. +62...)')
}
