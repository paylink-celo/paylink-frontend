import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MessageCircle, Sparkles, X, Send, CheckCircle2 } from 'lucide-react'

import { backendFetch, hasBackend } from '@/lib/backend'
import { parseInvoice, type AiDraft } from '@/lib/api'
import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { getAddresses } from '@/lib/addresses/addresses'
import { truncateAddress } from '@/lib/format'

import { buildMetadataURI } from '@/features/create/shared/build-metadata-uri'
import { useExtractVaultAndRedirect } from '@/features/create/shared/use-extract-vault-and-redirect'
import {
  ADDRESS_RE,
  buildCreateArgs,
  normaliseDueDate,
} from '@/features/create/shared/draft-to-create-args'

/**
 * PayLink chat drawer.
 *
 * Three message kinds:
 *  - plain text (user or assistant)
 *  - inline draft card with a "Create on-chain" button that triggers
 *    wagmi.writeContract against InvoiceFactory.createInvoice
 *  - a brief confirmation of the in-flight tx
 *
 * The drawer closes itself and navigates to /pay/:vault as soon as the
 * InvoiceCreated log is observed in the receipt.
 */

type Message =
  | { id: string; role: 'user'; kind: 'text'; content: string }
  | { id: string; role: 'assistant'; kind: 'text'; content: string }
  | { id: string; role: 'assistant'; kind: 'draft'; draft: AiDraft; autoDueBumped: boolean }

export default function ChatDrawer() {
  const [open, setOpen] = useState(false)
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)
  const navigate = useNavigate()

  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const newId = () => `m${(idRef.current += 1)}`

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  // ── on-chain plumbing (wagmi) ───────────────────────────────────────────
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash })

  // When the receipt arrives, extract vault address + navigate. Close the
  // drawer so the pay page is not visually obscured.
  useEffect(() => {
    if (receipt?.status === 'success') setOpen(false)
  }, [receipt])
  useExtractVaultAndRedirect(receipt, navigate)

  // Surface wallet rejection as a bot message so the chat stays the source
  // of context (instead of a toast the user may miss).
  useEffect(() => {
    if (!writeError) return
    setMessages((xs) => [
      ...xs,
      {
        id: newId(),
        role: 'assistant',
        kind: 'text',
        content:
          'Transaction cancelled: ' +
          (writeError.message?.split('\n')[0] ?? 'unknown error'),
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError])

  // Auto-scroll.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, drafting])

  const busy = sending || drafting || isPending || isMining

  // ── handlers ────────────────────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    const userMsg: Message = { id: newId(), role: 'user', kind: 'text', content: text }
    setMessages((xs) => [...xs, userMsg])
    setSending(true)
    try {
      // Build the history without the draft cards (LLM only wants text).
      const next = [...messages, userMsg]
      const history = next
        .filter((m): m is Extract<Message, { kind: 'text' }> => m.kind === 'text')
        .map((m) => ({ role: m.role, content: m.content }))
      const res = await backendFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userAddress: address, messages: history }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { role?: string; content?: string }
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          role: 'assistant',
          kind: 'text',
          content: body.content ?? '(no reply)',
        },
      ])
    } catch (err) {
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          role: 'assistant',
          kind: 'text',
          content: 'Error: ' + (err instanceof Error ? err.message : String(err)),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  async function draftInvoice() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((xs) => [...xs, { id: newId(), role: 'user', kind: 'text', content: text }])
    setDrafting(true)
    try {
      const { draft, message } = await parseInvoice(text)
      if (!draft) {
        setMessages((xs) => [
          ...xs,
          {
            id: newId(),
            role: 'assistant',
            kind: 'text',
            content:
              message || 'Could not turn that into an invoice. Include an amount and token.',
          },
        ])
        return
      }
      const { draft: normalised, bumped } = normaliseDueDate(draft)
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          role: 'assistant',
          kind: 'draft',
          draft: normalised,
          autoDueBumped: bumped,
        },
      ])
    } catch (err) {
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          role: 'assistant',
          kind: 'text',
          content: 'Draft failed: ' + (err instanceof Error ? err.message : String(err)),
        },
      ])
    } finally {
      setDrafting(false)
    }
  }

  async function createOnChain(draft: AiDraft) {
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed on this chain')

    let args
    try {
      args = buildCreateArgs(draft, addrs)
    } catch (err) {
      return toast.error(err instanceof Error ? err.message : String(err))
    }

    const metadataURI = await buildMetadataURI({
      flow: 'agent',
      note: draft.notes,
      token: draft.token,
      amount: draft.amount,
      dueDateIso: draft.dueDateIso,
      extra: { source: 'chat-drawer', isOpen: args.isOpen },
    })

    toast.info('Confirm in your wallet\u2026')
    setMessages((xs) => [
      ...xs,
      {
        id: newId(),
        role: 'assistant',
        kind: 'text',
        content: 'Sending transaction\u2026 please confirm in your wallet.',
      },
    ])
    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'createInvoice',
      args: [
        args.tokenAddr,
        args.totalWei,
        args.dueTs,
        metadataURI,
        args.isOpen,
        args.allowedPayers,
        args.payerAmounts,
      ],
    })
  }

  if (!hasBackend()) return null

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI copilot"
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#38A191,#2e8a7c)] text-white shadow-[0_14px_40px_rgba(56,161,145,0.35)]"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <aside
          className="island-shell fixed bottom-36 right-4 z-40 flex h-[min(72vh,540px)] w-[min(92vw,380px)] flex-col rounded-2xl p-4"
          style={{ backdropFilter: 'blur(6px)' }}
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="island-kicker m-0">PayLink copilot</p>
              <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
                Ask or draft an invoice
              </h3>
            </div>
            <button onClick={() => setOpen(false)} className="btn-ghost" aria-label="Close">
              <X size={16} />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto rounded-xl bg-white/50 p-3 text-sm"
          >
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="m-0 text-[var(--sea-ink-soft)]">
                  Ask anything, or describe an invoice and tap{' '}
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[rgba(79,184,178,0.18)] px-1.5 py-0.5 font-semibold text-[var(--lagoon-deep)]">
                    <Sparkles size={11} /> Draft
                  </span>{' '}
                  — I&rsquo;ll submit it on-chain after your wallet confirmation.
                </p>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  Try: <em>&ldquo;Bill 0x98fa&hellip;Fc1f 3 USDT due next Friday&rdquo;</em>.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <Bubble
                  key={m.id}
                  m={m}
                  onConfirm={createOnChain}
                  pending={isPending || isMining}
                />
              ))}
            </div>
            {sending && (
              <p className="mt-3 m-0 text-xs italic text-[var(--sea-ink-soft)]">thinking&hellip;</p>
            )}
            {drafting && (
              <p className="mt-3 m-0 text-xs italic text-[var(--sea-ink-soft)]">drafting&hellip;</p>
            )}
            {isMining && (
              <p className="mt-3 m-0 flex items-center gap-1 text-xs italic text-[var(--sea-ink-soft)]">
                <CheckCircle2 size={12} /> waiting for block confirmation&hellip;
              </p>
            )}
          </div>

          <form className="mt-3 flex gap-2" onSubmit={submit}>
            <input
              className="input flex-1"
              placeholder="Ask PayLink or describe an invoice&hellip;"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              type="button"
              onClick={draftInvoice}
              className="btn-secondary"
              title="Parse as invoice draft"
              aria-label="Draft invoice from message"
              disabled={!input.trim() || busy}
            >
              {drafting ? <span className="text-xs">&hellip;</span> : <Sparkles size={16} />}
            </button>
            <button
              className="btn-primary"
              type="submit"
              disabled={!input.trim() || busy}
            >
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </>
  )
}

// ── bubbles ───────────────────────────────────────────────────────────────

function Bubble({
  m,
  onConfirm,
  pending,
}: {
  m: Message
  onConfirm: (d: AiDraft) => void
  pending: boolean
}) {
  if (m.kind === 'text') {
    const isUser = m.role === 'user'
    return (
      <div className={isUser ? 'text-right' : ''}>
        <span
          className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
            isUser
              ? 'bg-[rgba(79,184,178,0.18)] text-[var(--sea-ink)]'
              : 'border border-[var(--line)] bg-white text-[var(--sea-ink)]'
          }`}
        >
          {m.content}
        </span>
      </div>
    )
  }
  return (
    <DraftCard
      draft={m.draft}
      autoDueBumped={m.autoDueBumped}
      onConfirm={onConfirm}
      pending={pending}
    />
  )
}

function DraftCard({
  draft,
  autoDueBumped,
  onConfirm,
  pending,
}: {
  draft: AiDraft
  autoDueBumped: boolean
  onConfirm: (d: AiDraft) => void
  pending: boolean
}) {
  const validPayers = useMemo(
    () => draft.payers.filter((p) => ADDRESS_RE.test(p.address)),
    [draft.payers],
  )
  const isOpen = validPayers.length === 0
  const payerLine = isOpen
    ? 'Open to any payer'
    : validPayers
        .map((p) => `• ${truncateAddress(p.address)} — ${p.amount} ${draft.token}`)
        .join('\n')

  return (
    <div className="w-full rounded-xl border border-[var(--line)] bg-white p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--lagoon-deep)]">
        <Sparkles size={12} /> Draft invoice
      </div>
      <dl className="mb-3 grid grid-cols-[84px_1fr] gap-y-1 text-sm">
        <dt className="text-[var(--sea-ink-soft)]">Mode</dt>
        <dd className="capitalize">{isOpen ? 'open' : draft.mode}</dd>
        <dt className="text-[var(--sea-ink-soft)]">Token</dt>
        <dd>{draft.token}</dd>
        <dt className="text-[var(--sea-ink-soft)]">Amount</dt>
        <dd>
          {draft.amount} {draft.token}
        </dd>
        <dt className="text-[var(--sea-ink-soft)]">Due</dt>
        <dd>
          {draft.dueDateIso}
          {autoDueBumped && (
            <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">(auto +7d)</span>
          )}
        </dd>
        <dt className="text-[var(--sea-ink-soft)]">Payers</dt>
        <dd className="whitespace-pre-wrap">{payerLine}</dd>
      </dl>
      <button
        className="btn-primary w-full"
        onClick={() => onConfirm(draft)}
        disabled={pending}
      >
        {pending ? 'Submitting on-chain\u2026' : 'Create on-chain'}
      </button>
    </div>
  )
}
