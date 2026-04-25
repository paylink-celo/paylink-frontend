import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { toast } from 'sonner'
import { Bot, Send, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { getAddresses } from '@/lib/addresses/addresses'
import { truncateAddress } from '@/lib/format'
import { parseInvoice, type AiDraft } from '@/lib/api'

import { buildMetadataURI } from '../shared/build-metadata-uri'
import { useExtractVaultAndRedirect } from '../shared/use-extract-vault-and-redirect'
import {
  ADDRESS_RE,
  buildCreateArgs,
  normaliseDueDate,
} from '../shared/draft-to-create-args'

type Message =
  | { id: string; role: 'bot'; kind: 'text'; content: string }
  | { id: string; role: 'user'; kind: 'text'; content: string }
  | { id: string; role: 'bot'; kind: 'draft'; draft: AiDraft; autoDueBumped: boolean }

export function AgentForm() {
  const navigate = useNavigate()
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const newId = () => `m${(idRef.current += 1)}`

  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'bot',
      kind: 'text',
      content:
        'Hi! Describe the invoice you want. Examples:\n' +
        '\u2022 "Send 3 USDT to 0x98fa\u2026Fc1f due in 7 days"\n' +
        '\u2022 "Split 300 cUSD between 0xA\u2026, 0xB\u2026, 0xC\u2026 equally, due next Friday"\n' +
        '\u2022 "Open invoice for 10 cUSD any agent can pay"',
    },
  ])

  // Auto-scroll on new messages.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  // ── on-chain plumbing ───────────────────────────────────────────────────
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash })
  useExtractVaultAndRedirect(receipt, navigate)

  // Surface wallet rejection / RPC errors as a bot message so the chat stays
  // the single source of context.
  useEffect(() => {
    if (!writeError) return
    setMessages((xs) => [
      ...xs,
      {
        id: newId(),
        role: 'bot',
        kind: 'text',
        content:
          'Transaction cancelled: ' +
          (writeError.message?.split('\n')[0] ?? 'unknown error'),
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError])

  const busy = thinking || isPending || isMining

  // ── handlers ────────────────────────────────────────────────────────────
  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((xs) => [...xs, { id: newId(), role: 'user', kind: 'text', content: text }])
    setThinking(true)
    try {
      const { draft, message } = await parseInvoice(text)
      if (!draft) {
        setMessages((xs) => [
          ...xs,
          {
            id: newId(),
            role: 'bot',
            kind: 'text',
            content:
              message ||
              'Sorry, I could not turn that into an invoice. Try again with an amount, token, and payer address.',
          },
        ])
      } else {
        const { draft: normalised, bumped } = normaliseDueDate(draft)
        setMessages((xs) => [
          ...xs,
          {
            id: newId(),
            role: 'bot',
            kind: 'draft',
            draft: normalised,
            autoDueBumped: bumped,
          },
        ])
      }
    } catch (err) {
      setMessages((xs) => [
        ...xs,
        {
          id: newId(),
          role: 'bot',
          kind: 'text',
          content: 'Error: ' + (err instanceof Error ? err.message : String(err)),
        },
      ])
    } finally {
      setThinking(false)
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
      extra: { source: 'chat-agent', isOpen: args.isOpen },
    })

    toast.info('Confirm in your wallet\u2026')
    setMessages((xs) => [
      ...xs,
      {
        id: newId(),
        role: 'bot',
        kind: 'text',
        content: 'Sending transaction\u2026 confirm in your wallet.',
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

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <Card className="form-card">
      <CardContent className="flex flex-col gap-3 px-5 py-5">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-[var(--lagoon-deep)]" />
          <h3 className="m-0 text-base font-semibold text-[var(--sea-ink)]">PayMe AI agent</h3>
        </div>
        <p className="m-0 -mt-2 text-sm text-[var(--sea-ink-soft)]">
          Describe the invoice in natural language. I’ll draft it and submit on-chain after you confirm in your wallet.
        </p>

        <div
          ref={listRef}
          className="flex max-h-[52vh] min-h-[220px] flex-col gap-3 overflow-y-auto rounded-xl bg-white/50 p-3 text-sm"
        >
          {messages.map((m) => (
            <Bubble
              key={m.id}
              m={m}
              onConfirm={createOnChain}
              pending={isPending || isMining}
            />
          ))}
          {thinking && (
            <p className="m-0 text-xs italic text-[var(--sea-ink-soft)]">thinking…</p>
          )}
          {isMining && (
            <p className="m-0 text-xs italic text-[var(--sea-ink-soft)]">
              waiting for block confirmation…
            </p>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Send 3 USDT to 0x… due in 5 days"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            aria-label="Describe invoice"
          />
          <button
            className="btn-primary"
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

// ── bubble component ──────────────────────────────────────────────────────

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
        .map((p) => `\u2022 ${truncateAddress(p.address)} \u2014 ${p.amount} ${draft.token}`)
        .join('\n')

  return (
    <div>
      <div className="inline-block w-full max-w-full rounded-xl border border-[var(--line)] bg-white p-3">
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--lagoon-deep)]">
          <Sparkles size={12} /> Draft invoice
        </div>
        <dl className="mb-3 grid grid-cols-[96px_1fr] gap-y-1 text-sm">
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
              <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">
                (auto-set +7d)
              </span>
            )}
          </dd>
          <dt className="text-[var(--sea-ink-soft)]">Payers</dt>
          <dd className="whitespace-pre-wrap">{payerLine}</dd>
          {draft.notes && (
            <>
              <dt className="text-[var(--sea-ink-soft)]">Note</dt>
              <dd className="whitespace-pre-wrap">{draft.notes}</dd>
            </>
          )}
        </dl>
        <button
          className="btn-primary w-full"
          onClick={() => onConfirm(draft)}
          disabled={pending}
        >
          {pending ? 'Submitting on-chain\u2026' : 'Create on-chain'}
        </button>
      </div>
    </div>
  )
}
