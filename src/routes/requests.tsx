import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi, PublicClient } from 'viem'
import { decodeEventLog } from 'viem'
import { toast } from 'sonner'

import { InvoiceFactoryAbi } from '../lib/contracts/abi'
import { getAddresses } from '../lib/contracts/addresses'
import { formatAmount, truncateAddress } from '../lib/format'

export const Route = createFileRoute('/requests')({ component: RequestsPage })

type InvoiceRequest = {
  requestId: `0x${string}`
  requester: `0x${string}`
  amount: bigint
  notes: string
  direction: 'incoming' | 'outgoing'
}

function RequestsPage() {
  const { address } = useAccount()
  const chainId = useChainId()
  const client = usePublicClient({ chainId })
  const addrs = getAddresses(chainId)

  const [rows, setRows] = useState<InvoiceRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!client || !address || !addrs.factory) return
    let cancelled = false
    setLoading(true)
    loadRequests(client, addrs.factory as `0x${string}`, address)
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch((e) => toast.error('Failed: ' + String(e)))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client, address, addrs.factory])

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <header className="mb-6">
        <p className="island-kicker mb-2">Requests</p>
        <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Invoice requests
        </h1>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Pull flow — someone is asking you to issue an invoice, or you're waiting on one.
        </p>
      </header>

      {!address && <p className="text-sm text-[var(--sea-ink-soft)]">Connect your wallet.</p>}
      {loading && <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>}
      {rows.length === 0 && !loading && address && (
        <p className="text-sm text-[var(--sea-ink-soft)]">No requests yet.</p>
      )}

      <div className="grid gap-4">
        {rows.map((r) => (
          <RequestCard key={r.requestId} req={r} factory={addrs.factory as `0x${string}`} cUSD={addrs.cUSD as `0x${string}`} />
        ))}
      </div>
    </main>
  )
}

function RequestCard({
  req,
  factory,
  cUSD,
}: {
  req: InvoiceRequest
  factory: `0x${string}`
  cUSD: `0x${string}`
}) {
  const navigate = useNavigate()
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!receipt || receipt.status !== 'success') return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: InvoiceFactoryAbi as Abi,
          data: log.data,
          topics: [...log.topics] as [signature: `0x${string}`, ...args: `0x${string}`[]],
        })
        if (decoded.eventName === 'InvoiceCreated') {
          const vault = (decoded.args as { vaultAddress: `0x${string}` }).vaultAddress
          toast.success('Request confirmed ✓ — vault deployed.')
          setTimeout(() => navigate({ to: '/pay/$vault', params: { vault } }), 300)
          return
        }
      } catch {
        // ignore
      }
    }
  }, [receipt, navigate])

  function confirm() {
    if (!due) return toast.error('Pick a due date')
    if (Date.parse(due) <= Date.now()) return toast.error('Due date must be in the future')
    writeContract({
      abi: InvoiceFactoryAbi as Abi,
      address: factory,
      functionName: 'confirmInvoiceRequest',
      args: [req.requestId, cUSD, BigInt(Math.floor(Date.parse(due) / 1000)), note || 'paylink://pull'],
    })
  }

  return (
    <div className="island-shell rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="island-kicker mb-1" style={{ color: req.direction === 'incoming' ? 'var(--palm)' : 'var(--lagoon-deep)' }}>
            {req.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
          </p>
          <p className="m-0 text-lg font-semibold text-[var(--sea-ink)]">{formatAmount(req.amount)}</p>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {req.direction === 'incoming' ? 'Requested by' : 'Sent to'} {truncateAddress(req.requester)}
          </p>
          {req.notes && <p className="mt-2 text-sm text-[var(--sea-ink)]">{req.notes}</p>}
        </div>
      </div>

      {req.direction === 'incoming' && (
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="input"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
          />
          <input
            className="input"
            placeholder="Optional note / ipfs URI"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btn-primary" onClick={confirm} disabled={isPending || mining}>
            {mining ? 'Mining…' : 'Confirm & deploy'}
          </button>
        </div>
      )}
    </div>
  )
}

async function loadRequests(client: PublicClient, factory: `0x${string}`, me: `0x${string}`): Promise<InvoiceRequest[]> {
  const [incoming, outgoing, fulfilled] = await Promise.all([
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestCreated',
      args: { counterparty: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestCreated',
      args: { requester: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceRequestFulfilled',
      fromBlock: 'earliest',
    }),
  ])

  const fulfilledIds = new Set(
    fulfilled.map((e) => (e.args as { requestId: `0x${string}` }).requestId),
  )

  const rows: InvoiceRequest[] = []
  for (const e of incoming) {
    const a = e.args as {
      requestId: `0x${string}`
      requester: `0x${string}`
      amount: bigint
      notes: string
    }
    if (fulfilledIds.has(a.requestId)) continue
    rows.push({
      requestId: a.requestId,
      requester: a.requester,
      amount: a.amount,
      notes: a.notes,
      direction: 'incoming',
    })
  }
  for (const e of outgoing) {
    const a = e.args as {
      requestId: `0x${string}`
      requester: `0x${string}`
      counterparty: `0x${string}`
      amount: bigint
      notes: string
    }
    if (fulfilledIds.has(a.requestId)) continue
    rows.push({
      requestId: a.requestId,
      requester: a.counterparty, // show counterparty in outgoing card
      amount: a.amount,
      notes: a.notes,
      direction: 'outgoing',
    })
  }
  return rows
}
