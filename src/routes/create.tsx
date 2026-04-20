import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { z } from 'zod'
import { toast } from 'sonner'
import { decodeEventLog } from 'viem'
import { Sparkles } from 'lucide-react'

import { InvoiceFactoryAbi } from '../lib/contracts/abi'
import { getAddresses } from '../lib/contracts/addresses'
import { parseAmount } from '../lib/format'
import { activeChain } from '../lib/chains'
import { backendFetch, hasBackend } from '../lib/backend'

export const Route = createFileRoute('/create')({ component: CreatePage })

const addressZ = z.string().regex(/^0x[a-fA-F0-9]{40}$/u, 'Must be a 0x-prefixed EVM address')
const amountZ = z.string().regex(/^\d+(\.\d{1,18})?$/u, 'Enter a positive amount')
const dueZ = z
  .string()
  .min(1, 'Pick a due date')
  .refine(
    (v) => Date.parse(v) > Date.now(),
    { message: 'Due date must be in the future' },
  )

type Tab = 'push' | 'split' | 'pull'

function CreatePage() {
  const [tab, setTab] = useState<Tab>('push')
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null)
  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-2">Create</p>
        <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          New invoice
        </h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Every invoice deploys its own isolated vault on {activeChain.name}.
        </p>
      </header>

      {hasBackend() && (
        <AiQuickStart
          onDraft={(draft) => {
            setAiDraft(draft)
            setTab(draft.mode)
          }}
        />
      )}

      <div className="island-shell rounded-2xl p-1 inline-flex mb-6 gap-1">
        {([
          ['push', 'Push · Single'],
          ['split', 'Split · Multi'],
          ['pull', 'Pull · Request'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={tab === k ? 'btn-primary' : 'btn-ghost'}
            style={{ minHeight: 40 }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'push' && <PushForm prefill={aiDraft?.mode === 'push' ? aiDraft : undefined} />}
      {tab === 'split' && <SplitForm prefill={aiDraft?.mode === 'split' ? aiDraft : undefined} />}
      {tab === 'pull' && <PullForm prefill={aiDraft?.mode === 'pull' ? aiDraft : undefined} />}
    </main>
  )
}

type AiDraft = {
  mode: Tab
  token: 'cUSD' | 'USDT'
  amount: string
  dueDateIso: string
  notes: string
  payers: Array<{ address: string; amount: string }>
  counterparty?: string
}

function AiQuickStart({ onDraft }: { onDraft: (draft: AiDraft) => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setLoading(true)
    try {
      const res = await backendFetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: text }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      onDraft(json.draft)
      toast.success('Draft filled — review below.')
    } catch (err) {
      toast.error('Parse failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={submit} className="island-shell feature-card mb-6 rounded-2xl p-5">
      <p className="island-kicker mb-2"><Sparkles size={12} className="mr-1 inline" /> AI quick-start</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1"
          placeholder={'e.g. "Bill Alice 50 cUSD for April design work, due next Friday"'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="btn-primary" type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Parsing…' : 'Draft invoice'}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
        The AI fills the form below; you still confirm and sign on-chain.
      </p>
    </form>
  )
}

// ---------- Push flow ----------
function PushForm({ prefill }: { prefill?: AiDraft }) {
  const navigate = useNavigate()
  const { address } = useAccount()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const [payer, setPayer] = useState(prefill?.payers[0]?.address ?? '')
  const [amount, setAmount] = useState(prefill?.amount ?? '')
  const [due, setDue] = useState(prefill?.dueDateIso ?? '')
  const [note, setNote] = useState(prefill?.notes ?? '')
  const [token, setToken] = useState<'cUSD' | 'USDT'>(prefill?.token ?? 'cUSD')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash })

  useExtractVaultAndRedirect(receipt, navigate)

  function submit() {
    const result = {
      payer: addressZ.safeParse(payer),
      amount: amountZ.safeParse(amount),
      due: dueZ.safeParse(due),
    }
    const nextErrs: Record<string, string> = {}
    if (!result.payer.success) nextErrs.payer = result.payer.error.issues[0].message
    if (!result.amount.success) nextErrs.amount = result.amount.error.issues[0].message
    if (!result.due.success) nextErrs.due = result.due.error.issues[0].message
    setErrors(nextErrs)
    if (Object.keys(nextErrs).length > 0) return

    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) {
      return toast.error(
        'Factory not deployed yet — deploy contracts and re-run sync-abi.',
      )
    }

    const amt = parseAmount(amount)
    const dueTs = BigInt(Math.floor(Date.parse(due) / 1000))

    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'createInvoice',
      args: [
        (token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`,
        amt,
        dueTs,
        note || 'paylink://push',
        false,
        [payer as `0x${string}`],
        [amt],
      ],
    })
    toast.info('Submitting transaction…')
  }

  return (
    <section className="island-shell rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payer wallet" error={errors.payer}>
          <input
            className="input"
            placeholder="0x…"
            value={payer}
            onChange={(e) => setPayer(e.target.value.trim())}
          />
        </Field>
        <Field label="Token">
          <select className="input" value={token} onChange={(e) => setToken(e.target.value as 'cUSD' | 'USDT')}>
            <option value="cUSD">cUSD</option>
            <option value="USDT">USDT</option>
          </select>
        </Field>
        <Field label="Amount" error={errors.amount}>
          <input
            className="input"
            placeholder="100"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
          />
        </Field>
        <Field label="Due date" error={errors.due}>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Note / metadata (optional)" fullWidth>
          <input
            className="input"
            placeholder="Design work, April 2026"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
          Creates one <code>InvoiceVault</code>. Share the resulting link with
          your payer.
        </p>
        <button className="btn-primary" onClick={submit} disabled={isPending || isMining}>
          {isPending ? 'Confirm in wallet…' : isMining ? 'Mining…' : 'Create invoice'}
        </button>
      </div>
    </section>
  )
}

// ---------- Split flow ----------
function SplitForm({ prefill }: { prefill?: AiDraft }) {
  const navigate = useNavigate()
  const { address } = useAccount()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const initialPayers =
    prefill?.payers && prefill.payers.length >= 2
      ? prefill.payers.map((p) => ({ addr: p.address, amt: p.amount }))
      : [
          { addr: '', amt: '' },
          { addr: '', amt: '' },
        ]
  const [payers, setPayers] = useState<Array<{ addr: string; amt: string }>>(initialPayers)
  const [due, setDue] = useState(prefill?.dueDateIso ?? '')
  const [note, setNote] = useState(prefill?.notes ?? '')
  const [token, setToken] = useState<'cUSD' | 'USDT'>(prefill?.token ?? 'cUSD')

  const total = useMemo(() => {
    try {
      return payers.reduce((acc, p) => {
        if (!p.amt) return acc
        return acc + Number(p.amt)
      }, 0)
    } catch {
      return 0
    }
  }, [payers])

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash })
  useExtractVaultAndRedirect(receipt, navigate)

  function addRow() {
    setPayers((xs) => [...xs, { addr: '', amt: '' }])
  }

  function removeRow(i: number) {
    setPayers((xs) => xs.filter((_, idx) => idx !== i))
  }

  function submit() {
    for (const p of payers) {
      if (!addressZ.safeParse(p.addr).success) return toast.error('Invalid payer address')
      if (!amountZ.safeParse(p.amt).success) return toast.error('Invalid payer amount')
    }
    if (!dueZ.safeParse(due).success) return toast.error('Pick a valid due date')
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed yet')

    const addrsArr = payers.map((p) => p.addr as `0x${string}`)
    const amts = payers.map((p) => parseAmount(p.amt))
    const totalWei = amts.reduce((acc, v) => acc + v, 0n)
    const dueTs = BigInt(Math.floor(Date.parse(due) / 1000))

    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'createInvoice',
      args: [
        (token === 'cUSD' ? addrs.cUSD : addrs.USDT) as `0x${string}`,
        totalWei,
        dueTs,
        note || 'paylink://split',
        false,
        addrsArr,
        amts,
      ],
    })
    toast.info('Submitting transaction…')
  }

  return (
    <section className="island-shell rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Token">
          <select className="input" value={token} onChange={(e) => setToken(e.target.value as 'cUSD' | 'USDT')}>
            <option value="cUSD">cUSD</option>
            <option value="USDT">USDT</option>
          </select>
        </Field>
        <Field label="Due date">
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Note / metadata" fullWidth>
          <input
            className="input"
            placeholder="Dinner at Nikkei, April"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-[var(--sea-ink)]">Payers</h3>
      <div className="space-y-3">
        {payers.map((p, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <input
              className="input"
              placeholder="0x… payer wallet"
              value={p.addr}
              onChange={(e) =>
                setPayers((xs) => xs.map((x, idx) => (idx === i ? { ...x, addr: e.target.value.trim() } : x)))
              }
            />
            <input
              className="input"
              placeholder="Amount"
              inputMode="decimal"
              value={p.amt}
              onChange={(e) =>
                setPayers((xs) => xs.map((x, idx) => (idx === i ? { ...x, amt: e.target.value.trim() } : x)))
              }
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => removeRow(i)}
              disabled={payers.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-3" onClick={addRow}>
        + Add payer
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
          Total: <strong>{total.toFixed(2)} {token}</strong> · {payers.length} payers
        </p>
        <button className="btn-primary" onClick={submit} disabled={isPending || isMining}>
          {isPending ? 'Confirm in wallet…' : isMining ? 'Mining…' : 'Create split bill'}
        </button>
      </div>
    </section>
  )
}

// ---------- Pull flow ----------
function PullForm({ prefill }: { prefill?: AiDraft }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const [counterparty, setCounterparty] = useState(prefill?.counterparty ?? '')
  const [amount, setAmount] = useState(prefill?.amount ?? '')
  const [notes, setNotes] = useState(prefill?.notes ?? '')

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash })

  function submit() {
    if (!addressZ.safeParse(counterparty).success) return toast.error('Invalid counterparty')
    if (!amountZ.safeParse(amount).success) return toast.error('Invalid amount')
    if (!address) return toast.error('Connect wallet first')
    if (!addrs.factory) return toast.error('Factory not deployed yet')

    writeContract({
      abi: InvoiceFactoryAbi,
      address: addrs.factory as `0x${string}`,
      functionName: 'requestInvoice',
      args: [counterparty as `0x${string}`, parseAmount(amount), notes || ''],
    })
    toast.info('Submitting request…')
  }

  if (isSuccess) {
    return (
      <section className="island-shell rounded-2xl p-6">
        <h3 className="mb-2 text-lg font-semibold">Request sent ✓</h3>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          The counterparty will see your request in their Requests inbox. Once
          they confirm, a vault is deployed and you can deposit the payment.
        </p>
        <a className="btn-secondary" href="/dashboard">
          View dashboard
        </a>
      </section>
    )
  }

  return (
    <section className="island-shell rounded-2xl p-6">
      <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
        Ask a service provider to issue you a formal invoice. They confirm on-chain and the vault gets created.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Counterparty (service provider)">
          <input
            className="input"
            placeholder="0x…"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value.trim())}
          />
        </Field>
        <Field label="Amount">
          <input
            className="input"
            placeholder="100"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
          />
        </Field>
        <Field label="Notes / scope" fullWidth>
          <input
            className="input"
            placeholder="Invoice for April design work"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={submit} disabled={isPending || isMining}>
          {isPending ? 'Confirm in wallet…' : isMining ? 'Mining…' : 'Send request'}
        </button>
      </div>
    </section>
  )
}

// ---------- Helpers ----------
function Field(props: { label: string; error?: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <label className={props.fullWidth ? 'sm:col-span-2' : ''}>
      <span className="label">{props.label}</span>
      {props.children}
      {props.error ? <span className="mt-1 block text-xs text-[var(--status-expired)]">{props.error}</span> : null}
    </label>
  )
}

function useExtractVaultAndRedirect(
  receipt: { status: string; logs: readonly { address: string; data: `0x${string}`; topics: readonly `0x${string}`[] }[] } | undefined,
  navigate: ReturnType<typeof useNavigate>,
) {
  if (!receipt || receipt.status !== 'success') return
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: InvoiceFactoryAbi,
        data: log.data,
        topics: [...log.topics] as [signature: `0x${string}`, ...args: `0x${string}`[]],
      })
      if (decoded.eventName === 'InvoiceCreated') {
        const vault = (decoded.args as { vaultAddress: `0x${string}` }).vaultAddress
        toast.success('Invoice created ✓')
        setTimeout(() => navigate({ to: '/pay/$vault', params: { vault } }), 300)
        return
      }
    } catch {
      // not our event
    }
  }
}
