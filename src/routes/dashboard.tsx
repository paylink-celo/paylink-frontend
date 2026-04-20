import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import type { Abi, PublicClient } from 'viem'

import { InvoiceFactoryAbi, InvoiceVaultAbi } from '../lib/contracts/abi'
import { getAddresses } from '../lib/contracts/addresses'
import { formatAmount, formatDate, statusLabel, truncateAddress } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import { fetchInvoicesByUser, hasSubgraph, statusFromSubgraph } from '../lib/subgraph'

export const Route = createFileRoute('/dashboard')({ component: DashboardPage })

type Invoice = {
  vault: `0x${string}`
  creator: `0x${string}`
  totalAmount: bigint
  totalCollected: bigint
  dueDate: bigint
  status: number
  role: 'sent' | 'received'
}

function DashboardPage() {
  const { address } = useAccount()
  const chainId = useChainId()
  const client = usePublicClient({ chainId })
  const { factory } = getAddresses(chainId)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const loader: Promise<Invoice[]> = hasSubgraph()
      ? loadFromSubgraph(address)
      : factory && client
        ? loadInvoices(client, factory as `0x${string}`, address)
        : Promise.resolve([])
    loader
      .then((rows) => {
        if (!cancelled) setInvoices(rows)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [address, factory, client])

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="island-kicker mb-2">Dashboard</p>
          <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            Your invoices
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Invoices you've created or been billed on.
          </p>
        </div>
        <Link to="/create" className="btn-primary">
          + New invoice
        </Link>
      </header>

      {!address && <Empty title="Connect wallet" body="Connect to view your invoices." />}
      {address && !factory && (
        <Empty
          title="Factory not deployed"
          body="Deploy the contracts (see paylink-contract/README.md), then run pnpm sync:abi and reload."
        />
      )}
      {loading && <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>}
      {error && <p className="text-sm text-[var(--status-expired)]">Failed to load: {error}</p>}

      {invoices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {invoices.map((inv) => (
            <InvoiceCard key={inv.vault} inv={inv} />
          ))}
        </div>
      )}

      {address && factory && !loading && invoices.length === 0 && !error && (
        <Empty title="No invoices yet" body="Create your first invoice or ask someone to bill you." />
      )}
    </main>
  )
}

function InvoiceCard({ inv }: { inv: Invoice }) {
  return (
    <Link
      to="/pay/$vault"
      params={{ vault: inv.vault }}
      className="island-shell feature-card rounded-2xl p-5 no-underline text-inherit"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="island-kicker mb-1" style={{ color: inv.role === 'sent' ? 'var(--palm)' : 'var(--lagoon-deep)' }}>
            {inv.role === 'sent' ? 'Sent' : 'Received'}
          </p>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {formatAmount(inv.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {inv.role === 'sent' ? 'To ' : 'From '}
            {truncateAddress(inv.creator)} · Due {formatDate(inv.dueDate)}
          </p>
        </div>
        <StatusBadge status={inv.status} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(23,58,64,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#4fb8b2,#2e7d63)]"
          style={{
            width:
              inv.totalAmount > 0n
                ? `${Math.min(100, Number((inv.totalCollected * 100n) / inv.totalAmount))}%`
                : '0%',
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
        Collected {formatAmount(inv.totalCollected)} / {formatAmount(inv.totalAmount)} · {statusLabel(inv.status)}
      </p>
    </Link>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="island-shell rounded-2xl p-8 text-center">
      <h3 className="mb-1 text-lg font-semibold text-[var(--sea-ink)]">{title}</h3>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{body}</p>
    </div>
  )
}

async function loadFromSubgraph(me: `0x${string}`): Promise<Invoice[]> {
  const r = await fetchInvoicesByUser(me)
  const mapSg = (inv: import('../lib/subgraph').SgInvoice, role: 'sent' | 'received'): Invoice => ({
    vault: inv.vault,
    creator: inv.creator,
    totalAmount: BigInt(inv.totalAmount),
    totalCollected: BigInt(inv.totalCollected),
    dueDate: BigInt(inv.dueDate),
    status: statusFromSubgraph(inv.status),
    role,
  })
  const seen = new Set<string>()
  const rows: Invoice[] = []
  for (const inv of r.sent) {
    rows.push(mapSg(inv, 'sent'))
    seen.add(inv.vault.toLowerCase())
  }
  for (const inv of r.received) {
    const key = inv.vault.toLowerCase()
    if (seen.has(key)) continue
    rows.push(mapSg(inv, 'received'))
  }
  rows.sort((a, b) => Number(b.dueDate - a.dueDate))
  return rows
}

async function loadInvoices(client: PublicClient, factory: `0x${string}`, me: `0x${string}`): Promise<Invoice[]> {
  // Fetch InvoiceCreated events for vaults where `me` is creator, plus all we've been payer in.
  const [asCreator, asPayer] = await Promise.all([
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceCreated',
      args: { creator: me },
      fromBlock: 'earliest',
    }),
    client.getContractEvents({
      address: factory,
      abi: InvoiceFactoryAbi as Abi,
      eventName: 'InvoiceCreated',
      fromBlock: 'earliest',
    }),
  ])

  const creatorVaults = asCreator.map((e) => (e.args as { vaultAddress: `0x${string}` }).vaultAddress)
  const allVaults = asPayer.map((e) => ({
    vault: (e.args as { vaultAddress: `0x${string}` }).vaultAddress,
    creator: (e.args as { creator: `0x${string}` }).creator,
  }))

  // Determine payer role by reading payerInfo(me) on each non-creator vault.
  const receivedChecks = allVaults.filter((v) => v.creator.toLowerCase() !== me.toLowerCase())
  const receivedInfo = await client.multicall({
    allowFailure: true,
    contracts: receivedChecks.map((v) => ({
      address: v.vault,
      abi: InvoiceVaultAbi as Abi,
      functionName: 'payerInfo',
      args: [me],
    })),
  })
  const receivedVaults: `0x${string}`[] = []
  receivedChecks.forEach((v, i) => {
    const r = receivedInfo[i]
    if (r.status === 'success' && r.result) {
      const info = r.result as { isAllowed: boolean; amountDue: bigint; amountPaid: bigint }
      if (info.isAllowed || info.amountDue > 0n || info.amountPaid > 0n) {
        receivedVaults.push(v.vault)
      }
    }
  })

  const uniqueVaults = Array.from(new Set([...creatorVaults, ...receivedVaults]))
  if (uniqueVaults.length === 0) return []

  // Bulk read core state per vault.
  const reads = uniqueVaults.flatMap((v) => [
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'creator' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'totalAmount' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'totalCollected' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'dueDate' },
    { address: v, abi: InvoiceVaultAbi as Abi, functionName: 'status' },
  ])
  const results = await client.multicall({ allowFailure: true, contracts: reads })

  const out: Invoice[] = []
  for (let i = 0; i < uniqueVaults.length; i++) {
    const base = i * 5
    const creator = results[base]?.result as `0x${string}` | undefined
    const totalAmount = results[base + 1]?.result as bigint | undefined
    const totalCollected = results[base + 2]?.result as bigint | undefined
    const dueDate = results[base + 3]?.result as bigint | undefined
    const statusVal = Number(results[base + 4]?.result ?? 0)
    if (!creator || totalAmount === undefined) continue
    out.push({
      vault: uniqueVaults[i],
      creator,
      totalAmount,
      totalCollected: totalCollected ?? 0n,
      dueDate: dueDate ?? 0n,
      status: statusVal,
      role: creator.toLowerCase() === me.toLowerCase() ? 'sent' : 'received',
    })
  }

  // Newest first (by due date desc as a heuristic).
  out.sort((a, b) => Number(b.dueDate - a.dueDate))
  return out
}
