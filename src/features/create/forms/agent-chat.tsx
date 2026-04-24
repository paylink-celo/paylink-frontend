import { useEffect, useRef, useState } from 'react'
import { useChainId, useConnection } from 'wagmi'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

import { Card, CardContent } from '@/components/ui/card'
import { useCreateInvoice } from '@/hooks/mutation/use-create-invoice'
import { getAddresses } from '@/lib/addresses/addresses'
import { backendFetch, hasBackend } from '@/lib/backend'
import { parseInvoice } from '@/lib/api'
import { txExplorerUrl } from '@/lib/chains'
import { parseAmount, truncateAddress } from '@/lib/format'
import type { HexAddress } from '@/lib/utils/tx-types'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import type { AiDraft, TokenSymbol } from '../shared/types'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/u
const DAY_IN_SECONDS = 86_400
const DEFAULT_DUE_DAYS = 30

type TextMessage = {
  id: string
  kind: 'text'
  role: 'user' | 'assistant'
  content: string
}

type DraftStatus = 'pending' | 'creating' | 'created' | 'failed'

type DraftMessage = {
  id: string
  kind: 'draft'
  role: 'assistant'
  draft: AiDraft
  status: DraftStatus
  vault?: HexAddress
  txHash?: HexAddress
  error?: string
}

type ChatMessage = TextMessage | DraftMessage

/**
 * An `AiDraft` is "actionable" (i.e. we can turn it into an on-chain invoice)
 * when it targets push/split mode, has a positive amount, and includes at
 * least one valid EVM payer address.
 */
function isActionableDraft(d: AiDraft | null | undefined): d is AiDraft {
  if (!d) return false
  if (d.mode !== 'push' && d.mode !== 'split') return false
  const amt = Number(d.amount)
  if (!Number.isFinite(amt) || amt <= 0) return false
  return d.payers.some((p) => ADDRESS_RE.test(p.address))
}

/**
 * Full-page AI chat panel rendered when the Create page's `agent` tab is
 * active. Replaces the old floating ChatDrawer — the copilot now lives as
 * a first-class tab instead of a docked widget.
 *
 * Beyond conversation, the panel turns the user's request into an on-chain
 * invoice: it runs the message through `/api/ai/parse-invoice` and, when the
 * result is an actionable bill draft (push/split with a valid payer),
 * renders a draft card with a Send Bill action backed by `useCreateInvoice`.
 * Non-actionable prompts fall through to `/api/ai/chat` as before.
 */
export function AgentChat() {
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)
  const createInvoice = useCreateInvoice()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const idCounter = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function newId(): string {
    idCounter.current += 1
    return `m${idCounter.current}`
  }

  function updateMessage(id: string, patch: Partial<DraftMessage>) {
    setMessages((xs) =>
      xs.map((m) => (m.id === id && m.kind === 'draft' ? { ...m, ...patch } : m)),
    )
  }

  // Keep the transcript scrolled to the latest turn when new messages arrive.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const userMsg: ChatMessage = {
      id: newId(),
      kind: 'text',
      role: 'user',
      content: text,
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setSending(true)
    setError(null)

    // 1. Try to parse the message as an invoice draft first.
    try {
      const parsed = await parseInvoice(text)
      if (!parsed.error && isActionableDraft(parsed.draft)) {
        setMessages((xs) => [
          ...xs,
          {
            id: newId(),
            kind: 'draft',
            role: 'assistant',
            draft: parsed.draft,
            status: 'pending',
          },
        ])
        setSending(false)
        return
      }
    } catch {
      // Parse failed — fall back to conversational chat below.
    }

    // 2. Not an actionable bill — defer to the conversational endpoint.
    try {
      const res = await backendFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          messages: next
            .filter((m): m is TextMessage => m.kind === 'text')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { role?: string; content?: string }
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          kind: 'text',
          role: 'assistant',
          content: body.content ?? '(no reply)',
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  async function executeDraft(message: DraftMessage) {
    if (executingId) return
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed on this chain yet')

    const { draft } = message
    const tokenSymbol = draft.token as TokenSymbol
    const tokenAddr = tokenSymbol === 'cUSD' ? addrs.cUSD : addrs.USDT
    if (!tokenAddr) return toast.error(`${tokenSymbol} address missing on this chain`)

    const validPayers = draft.payers.filter((p) => ADDRESS_RE.test(p.address))
    if (validPayers.length === 0) return toast.error('No valid payer address in draft')

    setExecutingId(message.id)
    updateMessage(message.id, { status: 'creating', error: undefined })

    try {
      const totalAmount = parseAmount(draft.amount)
      const nowSec = Math.floor(Date.now() / 1000)
      const parsedDue = Math.floor(Date.parse(draft.dueDateIso) / 1000)
      const dueTs =
        Number.isFinite(parsedDue) && parsedDue > nowSec
          ? parsedDue
          : nowSec + DAY_IN_SECONDS * DEFAULT_DUE_DAYS

      const metadataURI = await buildMetadataURI({
        flow: draft.mode,
        note: draft.notes,
        token: tokenSymbol,
        amount: draft.amount,
        dueDateIso: draft.dueDateIso,
      })

      const result = await createInvoice.mutation.mutateAsync({
        factory: addrs.factory as HexAddress,
        token: tokenAddr as HexAddress,
        totalAmount,
        dueDate: BigInt(dueTs),
        metadataURI,
        isOpenPayment: false,
        allowedPayers: validPayers.map((p) => p.address as HexAddress),
        payerAmounts: validPayers.map((p) =>
          parseAmount(p.amount && p.amount !== '' ? p.amount : draft.amount),
        ),
      })

      updateMessage(message.id, {
        status: 'created',
        vault: result.vault ?? undefined,
      })
    } catch (err) {
      updateMessage(message.id, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setExecutingId(null)
    }
  }

  if (!hasBackend()) {
    return (
      <Card className="form-card">
        <CardContent className="px-5 py-6">
          <p className="island-kicker mb-1">PayLink copilot</p>
          <h3 className="mb-2 text-base font-semibold text-(--sea-ink)">
            Backend not configured
          </h3>
          <p className="text-sm text-(--sea-ink-soft)">
            Set <code>VITE_BACKEND_URL</code> to enable the AI chat.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="form-card">
      <CardContent className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col px-5 py-5">
        <header className="mb-3">
          <p className="island-kicker m-0">PayLink copilot</p>
          <h3 className="m-0 text-base font-semibold text-(--sea-ink)">Ask anything</h3>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-xl bg-white/50 p-3 text-sm"
        >
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="m-0 flex flex-wrap items-center gap-1 text-(--sea-ink-soft)">
                Describe the invoice you want to send
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[rgba(79,184,178,0.18)] px-1.5 py-0.5 font-semibold text-(--lagoon-deep)">
                  <SparklesIcon className="size-3" /> I’ll draft it
                </span>
                and you sign to send.
              </p>
              <p className="m-0 text-xs text-(--sea-ink-soft)">
                Try: <em>“Send bill to 0x6D9D…eB3 for 5 cUSD — eat naspad”</em>.
              </p>
            </div>
          )}
          {messages.map((m) =>
            m.kind === 'text' ? (
              <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : ''}`}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-[rgba(79,184,178,0.18)] text-(--sea-ink)'
                      : 'border border-(--line) bg-white text-(--sea-ink)'
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ) : (
              <DraftCard
                key={m.id}
                message={m}
                busy={executingId === m.id}
                disabled={executingId !== null && executingId !== m.id}
                onExecute={() => executeDraft(m)}
              />
            ),
          )}
          {sending && (
            <p className="text-xs italic text-(--sea-ink-soft)">thinking…</p>
          )}
          {error && (
            <p className="text-xs text-(--status-expired)" role="alert">
              {error}
            </p>
          )}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={submit}>
          <input
            className="input flex-1"
            placeholder="Ask PayLink or describe an invoice…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            className="btn-primary"
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="size-4 -rotate-45" />
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

function DraftCard({
  message,
  busy,
  disabled,
  onExecute,
}: {
  message: DraftMessage
  busy: boolean
  disabled: boolean
  onExecute: () => void
}) {
  const { draft } = message
  const payer = draft.payers.find((p) => ADDRESS_RE.test(p.address))
  const payerLabel = payer
    ? draft.counterparty && draft.counterparty !== payer.address
      ? `${draft.counterparty} (${truncateAddress(payer.address)})`
      : truncateAddress(payer.address)
    : draft.counterparty ?? 'unknown'

  const dueLabel = draft.dueDateIso
    ? new Date(draft.dueDateIso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Default (+30 days)'

  return (
    <div className="mb-3">
      <div className="w-full max-w-[92%] rounded-2xl border border-(--line) bg-white p-3 shadow-[0_4px_14px_rgba(23,58,64,0.06)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(79,184,178,0.18)] px-2 py-0.5 text-xs font-semibold text-(--lagoon-deep)">
            <SparklesIcon className="size-3" />
            {draft.mode === 'split' ? 'Split bill draft' : 'Invoice draft'}
          </span>
          {message.status === 'created' && (
            <span className="text-xs font-semibold text-(--lagoon-deep)">Sent ✓</span>
          )}
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-(--sea-ink)">
          <dt className="text-(--sea-ink-soft)">To</dt>
          <dd className="break-all font-medium">{payerLabel}</dd>
          <dt className="text-(--sea-ink-soft)">Amount</dt>
          <dd className="font-semibold">
            {draft.amount} {draft.token}
          </dd>
          <dt className="text-(--sea-ink-soft)">Due</dt>
          <dd>{dueLabel}</dd>
          {draft.notes?.trim() && (
            <>
              <dt className="text-(--sea-ink-soft)">Note</dt>
              <dd className="break-words">{draft.notes}</dd>
            </>
          )}
        </dl>

        {message.status === 'failed' && message.error && (
          <p className="mt-2 text-xs text-(--status-expired)" role="alert">
            {message.error}
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          {message.status === 'created' && message.vault ? (
            <Link
              to="/pay/$vault"
              params={{ vault: message.vault }}
              className="btn-secondary inline-flex items-center gap-1.5 text-sm"
            >
              View invoice
              <ArrowTopRightOnSquareIcon className="size-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={onExecute}
              disabled={busy || disabled}
            >
              {busy
                ? message.status === 'creating'
                  ? 'Sending\u2026'
                  : 'Processing\u2026'
                : message.status === 'failed'
                  ? 'Retry'
                  : 'Send Bill'}
            </button>
          )}
          {message.status === 'created' && message.txHash && (
            <a
              href={txExplorerUrl(message.txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-(--lagoon-deep) underline"
            >
              tx
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
