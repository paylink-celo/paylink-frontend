import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import type { Abi } from 'viem'
import { erc20Abi } from 'viem'

import { InvoiceVaultAbi } from '../lib/contracts/abi'
import { formatAmount, formatDate, parseAmount, statusLabel, truncateAddress } from '../lib/format'
import CopyButton from '../components/CopyButton'
import StatusBadge from '../components/StatusBadge'
import { miniPayDeepLink } from '../lib/minipay'
import { explorerUrl } from '../lib/chains'

export const Route = createFileRoute('/pay/$vault')({
  component: PayPage,
})

function PayPage() {
  const { vault } = Route.useParams()
  const vaultAddr = vault as `0x${string}`
  const { address: me } = useAccount()
  const chainId = useChainId()

  const { data: bulk, refetch } = useReadContracts({
    contracts: [
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'creator' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'token' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'totalAmount' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'totalCollected' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'dueDate' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'status' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'metadataURI' },
      { address: vaultAddr, abi: InvoiceVaultAbi as Abi, functionName: 'isOpenPayment' },
    ],
    query: { refetchInterval: 6000 },
  })

  const creator = (bulk?.[0]?.result as `0x${string}` | undefined) ?? undefined
  const tokenAddr = (bulk?.[1]?.result as `0x${string}` | undefined) ?? undefined
  const totalAmount = (bulk?.[2]?.result as bigint | undefined) ?? 0n
  const totalCollected = (bulk?.[3]?.result as bigint | undefined) ?? 0n
  const dueDate = (bulk?.[4]?.result as bigint | undefined) ?? 0n
  const status = Number(bulk?.[5]?.result ?? 0)
  const metadata = (bulk?.[6]?.result as string | undefined) ?? ''
  const isOpen = Boolean(bulk?.[7]?.result ?? false)

  const { data: payerInfo } = useReadContract({
    address: vaultAddr,
    abi: InvoiceVaultAbi as Abi,
    functionName: 'payerInfo',
    args: me ? [me] : undefined,
    query: { enabled: Boolean(me) },
  })

  const info = payerInfo as
    | { amountDue: bigint; amountPaid: bigint; isAllowed: boolean; paidBy: `0x${string}` }
    | undefined
  const remainingMe = info ? info.amountDue - info.amountPaid : 0n
  const canPay = isOpen || (info?.isAllowed ?? false)

  // Share link
  const payUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/pay/${vaultAddr}`
  }, [vaultAddr])

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="island-kicker mb-2">Invoice</p>
          <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            {formatAmount(totalAmount)} {tokenLabel(tokenAddr, chainId)}
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            From {creator ? truncateAddress(creator) : '—'} · Due {formatDate(dueDate)}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      <section className="island-shell rounded-2xl p-6 mb-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="label">Collected</p>
            <p className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
              {formatAmount(totalCollected)} / {formatAmount(totalAmount)}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(23,58,64,0.08)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4fb8b2,#2e7d63)]"
                style={{
                  width:
                    totalAmount > 0n
                      ? `${Math.min(100, Number((totalCollected * 100n) / totalAmount))}%`
                      : '0%',
                }}
              />
            </div>
          </div>
          <div>
            <p className="label">Vault</p>
            <p className="m-0 font-mono text-sm text-[var(--sea-ink)]">{truncateAddress(vaultAddr, 8)}</p>
            <div className="mt-2 flex gap-2">
              <CopyButton value={vaultAddr} label="Address" />
              <a className="btn-ghost" href={explorerUrl(vaultAddr)} target="_blank" rel="noreferrer">
                Explorer
              </a>
            </div>
          </div>
          {metadata && (
            <div className="sm:col-span-2">
              <p className="label">Metadata</p>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{metadata}</p>
            </div>
          )}
        </div>
      </section>

      {me === creator ? (
        <CreatorActions vaultAddr={vaultAddr} status={status} onDone={() => refetch()} />
      ) : canPay && remainingMe > 0n ? (
        <PayerActions
          vaultAddr={vaultAddr}
          tokenAddr={tokenAddr!}
          remaining={isOpen ? totalAmount - totalCollected : remainingMe}
          isOpen={isOpen}
          onDone={() => refetch()}
        />
      ) : status === 3 ? (
        <Banner kind="ok" title="Settled" body="This invoice has been claimed by the creator. Thanks!" />
      ) : status === 6 ? (
        <RefundActions vaultAddr={vaultAddr} hasStake={Boolean(info && info.amountPaid > 0n)} onDone={() => refetch()} />
      ) : (
        <Banner
          kind="info"
          title={canPay ? 'Nothing to pay' : 'Not an allowed payer'}
          body={
            canPay
              ? `You've already paid your share on this invoice. Current status: ${statusLabel(status)}.`
              : 'Your wallet is not on the allowed payers list for this invoice.'
          }
        />
      )}

      <section className="island-shell rounded-2xl p-6 mt-6">
        <p className="island-kicker mb-2">Share</p>
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="rounded-xl bg-white p-3 border border-[var(--line)]">
            <QRCodeSVG value={payUrl || vaultAddr} size={160} />
          </div>
          <div>
            <p className="mb-1 text-sm text-[var(--sea-ink)] break-all font-mono">{payUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton value={payUrl} label="Link" />
              <a className="btn-secondary" href={miniPayDeepLink(payUrl)} target="_blank" rel="noreferrer">
                Open in MiniPay
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function tokenLabel(addr: `0x${string}` | undefined, _chainId: number) {
  if (!addr) return 'token'
  const lower = addr.toLowerCase()
  if (lower === '0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b') return 'cUSD'
  if (lower === '0xd077a400968890eacc75cdc901f0356c943e4fdb') return 'USDT'
  if (lower === '0x765de816845861e75a25fca122bb6898b8b1282a') return 'cUSD'
  if (lower === '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e') return 'USDT'
  return 'token'
}

function PayerActions({
  vaultAddr,
  tokenAddr,
  remaining,
  isOpen,
  onDone,
}: {
  vaultAddr: `0x${string}`
  tokenAddr: `0x${string}`
  remaining: bigint
  isOpen: boolean
  onDone: () => void
}) {
  const { address: me } = useAccount()
  const [input, setInput] = useState<string>('')
  const [phase, setPhase] = useState<'idle' | 'approving' | 'depositing'>('idle')

  useEffect(() => {
    if (!isOpen && input === '') setInput(asInput(remaining))
  }, [isOpen, remaining, input])

  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract()
  const { isSuccess: approved, isLoading: miningApprove } = useWaitForTransactionReceipt({ hash: approveHash })
  const { data: depositHash, writeContract: writeDeposit, isPending: isDepositing } = useWriteContract()
  const { isSuccess: deposited, isLoading: miningDeposit } = useWaitForTransactionReceipt({ hash: depositHash })

  useEffect(() => {
    if (approved && phase === 'approving') {
      setPhase('depositing')
      writeDeposit({
        abi: InvoiceVaultAbi as Abi,
        address: vaultAddr,
        functionName: 'deposit',
        args: [parseInput(input)],
      })
    }
  }, [approved, phase, vaultAddr, input, writeDeposit])

  useEffect(() => {
    if (deposited && phase === 'depositing') {
      setPhase('idle')
      toast.success('Payment sent ✓')
      onDone()
    }
  }, [deposited, phase, onDone])

  function pay() {
    if (!me) return toast.error('Connect wallet first')
    const amount = parseInput(input)
    if (amount <= 0n) return toast.error('Enter an amount')
    setPhase('approving')
    writeApprove({
      abi: erc20Abi,
      address: tokenAddr,
      functionName: 'approve',
      args: [vaultAddr, amount],
    })
  }

  const busy = isApproving || miningApprove || isDepositing || miningDeposit

  return (
    <section className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-2">Pay</p>
      <h3 className="text-lg font-semibold text-[var(--sea-ink)]">Your share</h3>
      <p className="mt-1 mb-4 text-sm text-[var(--sea-ink-soft)]">
        {isOpen
          ? `Open invoice — contribute any amount up to ${formatAmount(remaining)} remaining.`
          : `You owe ${formatAmount(remaining)}. You'll approve the token, then deposit in one flow.`}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="label">Amount</span>
          <input
            className="input"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
          />
        </label>
        <button className="btn-primary" onClick={pay} disabled={busy}>
          {phase === 'approving' ? 'Approving…' : phase === 'depositing' ? 'Depositing…' : 'Pay'}
        </button>
      </div>
    </section>
  )
}

function CreatorActions({
  vaultAddr,
  status,
  onDone,
}: {
  vaultAddr: `0x${string}`
  status: number
  onDone: () => void
}) {
  const { data: releaseHash, writeContract: doRelease, isPending } = useWriteContract()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash: releaseHash })
  const { data: cancelHash, writeContract: doCancel, isPending: cancelling } = useWriteContract()
  const { isSuccess: cancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Released ✓')
      onDone()
    }
  }, [isSuccess, onDone])
  useEffect(() => {
    if (cancelled) {
      toast.success('Cancelled')
      onDone()
    }
  }, [cancelled, onDone])

  const canRelease = status === 1 || status === 2 // PARTIAL or FUNDED
  const canCancel = status === 0 // PENDING

  return (
    <section className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-2">Creator actions</p>
      <div className="flex flex-wrap gap-3">
        <button
          className="btn-primary"
          disabled={!canRelease || isPending || isLoading}
          onClick={() =>
            doRelease({
              abi: InvoiceVaultAbi as Abi,
              address: vaultAddr,
              functionName: 'release',
            })
          }
        >
          {isLoading ? 'Releasing…' : 'Release funds'}
        </button>
        <button
          className="btn-ghost"
          disabled={!canCancel || cancelling}
          onClick={() =>
            doCancel({
              abi: InvoiceVaultAbi as Abi,
              address: vaultAddr,
              functionName: 'cancel',
            })
          }
        >
          Cancel invoice
        </button>
      </div>
      {!canRelease && !canCancel && (
        <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
          No actions available in current status: {statusLabel(status)}.
        </p>
      )}
    </section>
  )
}

function RefundActions({
  vaultAddr,
  hasStake,
  onDone,
}: {
  vaultAddr: `0x${string}`
  hasStake: boolean
  onDone: () => void
}) {
  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })
  useEffect(() => {
    if (isSuccess) {
      toast.success('Refunded ✓')
      onDone()
    }
  }, [isSuccess, onDone])

  if (!hasStake) {
    return <Banner kind="info" title="Expired" body="This invoice is expired. No action needed for you." />
  }
  return (
    <section className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-2">Expired</p>
      <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
        Due date passed and the invoice never settled. You can pull your deposit back.
      </p>
      <button
        className="btn-primary"
        disabled={isPending || isLoading}
        onClick={() =>
          writeContract({ abi: InvoiceVaultAbi as Abi, address: vaultAddr, functionName: 'refund' })
        }
      >
        {isLoading ? 'Refunding…' : 'Refund my deposit'}
      </button>
    </section>
  )
}

function Banner({ kind, title, body }: { kind: 'info' | 'ok'; title: string; body: string }) {
  return (
    <section className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-2" style={{ color: kind === 'ok' ? 'var(--status-settled)' : 'var(--kicker)' }}>
        {kind === 'ok' ? '✓ ' : ''}
        {title}
      </p>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{body}</p>
    </section>
  )
}

function asInput(v: bigint): string {
  // Convert wei-ish bigint to human decimal string (assumes 18 decimals).
  const s = formatAmount(v).replace(/,/g, '')
  return s === '0.00' ? '' : s
}

function parseInput(v: string): bigint {
  if (!v) return 0n
  try {
    return parseAmount(v)
  } catch {
    return 0n
  }
}
