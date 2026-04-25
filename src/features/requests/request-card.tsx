import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'
import { decodeEventLog } from 'viem'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, XCircle } from 'lucide-react'

import { InvoiceFactoryAbi } from '@/lib/abis/factory-abi'
import { formatAmount, truncateAddress } from '@/lib/format'
import { useInvalidateAll } from '@/lib/utils/invalidate-queries'
import { tokenLabel } from '@/features/pay/helpers'

import { avatarToneFor, displayNameFor } from './helpers'
import { RequestHeader } from './request-header'
import type { InvoiceRequest } from './types'

type Phase = 'idle' | 'confirming' | 'rejecting'

export function RequestCard({
  req,
  factory,
  cUSD,
  onDismiss,
}: {
  req: InvoiceRequest
  factory: `0x${string}`
  cUSD: `0x${string}`
  onDismiss: (id: string) => void
}) {
  const navigate = useNavigate()
  const invalidateAll = useInvalidateAll()

  // UI state — the card expands inline to capture additional input
  // (due date for confirm, reason for reject) before sending the tx.
  const [phase, setPhase] = useState<Phase>('idle')
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')

  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract()
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash })

  // Reset expanded panels after a wallet rejection so the user can retry.
  useEffect(() => {
    if (writeError) setPhase('idle')
  }, [writeError])

  // Navigate to the new vault once the Confirm receipt arrives.
  useEffect(() => {
    if (!receipt || receipt.status !== 'success' || phase !== 'confirming') return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: InvoiceFactoryAbi as Abi,
          data: log.data,
          topics: [...log.topics] as [signature: `0x${string}`, ...args: `0x${string}`[]],
        })
        if (decoded.eventName === 'InvoiceCreated') {
          const vault = (decoded.args as unknown as { vaultAddress: `0x${string}` }).vaultAddress
          toast.success('Request accepted \u2713 \u2014 payment account created.')
          invalidateAll()
          setTimeout(() => navigate({ to: '/pay/$vault', params: { vault } }), 300)
          return
        }
      } catch {
        // ignore non-matching logs
      }
    }
  }, [receipt, navigate, phase])

  // For rejects we just hide locally once the tx confirms. The subgraph will
  // surface the row again in the Rejected tab on the next refetch.
  useEffect(() => {
    if (!receipt || receipt.status !== 'success' || phase !== 'rejecting') return
    toast.success('Request rejected \u2713')
    invalidateAll()
    onDismiss(req.requestId)
    setPhase('idle')
    reset()
  }, [receipt, phase, onDismiss, req.requestId, reset])

  function startConfirm() {
    setPhase('confirming')
  }

  function startReject() {
    setPhase('rejecting')
  }

  function cancelFlow() {
    setPhase('idle')
    setReason('')
  }

  function confirm() {
    if (!due) return toast.error('Pick a due date')
    if (Date.parse(due) <= Date.now()) return toast.error('Due date must be in the future')
    writeContract({
      abi: InvoiceFactoryAbi as Abi,
      address: factory,
      functionName: 'confirmInvoiceRequest',
      args: [req.requestId, cUSD, BigInt(Math.floor(Date.parse(due) / 1000)), note || 'payme://pull'],
    })
  }

  function reject() {
    writeContract({
      abi: InvoiceFactoryAbi as Abi,
      address: factory,
      functionName: 'rejectInvoiceRequest',
      args: [req.requestId, reason.trim().slice(0, 280)],
    })
  }

  const displayName = displayNameFor(req.counterparty)
  const subtitle = req.notes?.trim() || truncateAddress(req.counterparty)
  const avatarTone = avatarToneFor(req.counterparty)
  const busy = isPending || mining

  // ── Fulfilled state ───────────────────────────────────────────────────
  // The card splits into three flavours now:
  //   1. outgoing + unpaid  — user requested + counterparty accepted. Now
  //      the user is on the hook to pay; surface a big CTA.
  //   2. outgoing + paid    — settled on both sides; show a neutral "Paid".
  //   3. incoming           — user accepted; waiting for requester to pay.
  if (req.fulfilledVault) {
    const fi = req.fulfilledInvoice
    // Vault-level statuses that still require the payer to act. For requests,
    // the requester is the sole payer so we can rely purely on vault status.
    const UNPAID = new Set([0, 1]) // PENDING, PARTIAL
    const settled = fi ? fi.status === 3 : false
    const unpaid = fi ? UNPAID.has(fi.status) : true // pessimistic when subgraph missing
    const remaining = fi ? fi.totalAmount - fi.totalCollected : req.amount
    const tokenSym = fi ? tokenLabel(fi.token) : ''

    if (req.direction === 'outgoing' && unpaid) {
      // "Your request was accepted — time to pay" — most important case.
      return (
        <Link
          to="/pay/$vault"
          params={{ vault: req.fulfilledVault }}
          className="request-card no-underline text-inherit block"
          style={{ borderColor: 'var(--status-expired, #E08043)' }}
        >
          <RequestHeader
            direction={req.direction}
            name={displayName}
            subtitle={subtitle}
            amount={req.amount}
            avatarTone={avatarTone}
          />
          <div className="request-divider" />
          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-1 text-sm font-semibold text-[#B9603A]">
                <AlertTriangle size={14} /> Accepted — pay now
              </p>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                {formatAmount(remaining)} {tokenSym} remaining
              </p>
            </div>
            <span className="request-btn request-btn--primary flex items-center gap-1">
              Pay <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )
    }

    if (req.direction === 'outgoing' && settled) {
      return (
        <Link
          to="/pay/$vault"
          params={{ vault: req.fulfilledVault }}
          className="request-card no-underline text-inherit block"
        >
          <RequestHeader
            direction={req.direction}
            name={displayName}
            subtitle={subtitle}
            amount={req.amount}
            avatarTone={avatarTone}
          />
          <div className="request-divider" />
          <div className="flex items-center justify-end gap-3 pt-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-[var(--lagoon-deep)]">
              <CheckCircle2 size={14} /> Paid
            </span>
          </div>
        </Link>
      )
    }

    // incoming (user is creator) or outgoing with unusual vault status
    // (cancelled/expired/disputed): show neutral accepted label.
    const label =
      req.direction === 'incoming'
        ? settled
          ? 'Paid by requester'
          : 'Accepted — awaiting payment'
        : 'Accepted'
    return (
      <Link
        to="/pay/$vault"
        params={{ vault: req.fulfilledVault }}
        className="request-card no-underline text-inherit block"
      >
        <RequestHeader
          direction={req.direction}
          name={displayName}
          subtitle={subtitle}
          amount={req.amount}
          avatarTone={avatarTone}
        />
        <div className="request-divider" />
        <div className="flex items-center justify-end gap-3 pt-3">
          <span className="flex items-center gap-1 text-sm font-semibold text-[var(--lagoon-deep)]">
            <CheckCircle2 size={14} /> {label}
          </span>
        </div>
      </Link>
    )
  }

  // ── Rejected state (on-chain) ─────────────────────────────────────────
  if (req.rejected) {
    return (
      <div className="request-card">
        <RequestHeader
          direction={req.direction}
          name={displayName}
          subtitle={subtitle}
          amount={req.amount}
          avatarTone={avatarTone}
        />
        <div className="request-divider" />
        <div className="flex flex-col gap-1 pt-3">
          <span className="flex items-center gap-1 text-sm font-semibold text-[#A4463A]">
            <XCircle size={14} /> Rejected
          </span>
          {req.rejectReason && (
            <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
              Reason: <em>{req.rejectReason}</em>
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Pending state ─────────────────────────────────────────────────────
  return (
    <div className="request-card">
      <RequestHeader
        direction={req.direction}
        name={displayName}
        subtitle={subtitle}
        amount={req.amount}
        avatarTone={avatarTone}
      />

      {req.direction === 'incoming' && phase === 'confirming' && (
        <div className="mt-3 grid gap-2">
          <div className="input-group">
            <input
              className="input-soft"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Due date"
            />
            <span className="input-group-icon" aria-hidden>
              <Calendar size={16} />
            </span>
          </div>
          <input
            className="input-soft"
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {req.direction === 'incoming' && phase === 'rejecting' && (
        <div className="mt-3 grid gap-2">
          <label className="text-xs font-semibold text-[var(--sea-ink-soft)]">
            Reason (optional, shown to requester)
          </label>
          <textarea
            className="input-soft min-h-[68px] resize-none"
            placeholder="e.g. Already paid offline"
            maxLength={280}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}

      <div className="request-divider" />

      <div className="flex items-center justify-end gap-3 pt-3">
        {req.direction === 'incoming' ? (
          phase === 'idle' ? (
            <>
              <button
                type="button"
                className="request-link"
                onClick={startReject}
                disabled={busy}
              >
                Decline
              </button>
              <button
                type="button"
                className="request-btn request-btn--primary"
                onClick={startConfirm}
              >
                Accept
              </button>
            </>
          ) : phase === 'confirming' ? (
            <>
              <button type="button" className="request-link" onClick={cancelFlow} disabled={busy}>
                Back
              </button>
              <button
                type="button"
                className="request-btn request-btn--primary"
                onClick={confirm}
                disabled={busy}
              >
                {mining ? 'Confirming\u2026' : isPending ? 'Signing\u2026' : 'Confirm'}
              </button>
            </>
          ) : (
            // rejecting
            <>
              <button type="button" className="request-link" onClick={cancelFlow} disabled={busy}>
                Back
              </button>
              <button
                type="button"
                className="request-btn request-btn--primary"
                onClick={reject}
                disabled={busy}
                style={{ background: '#D9564A' }}
              >
                {mining ? 'Rejecting\u2026' : isPending ? 'Signing\u2026' : 'Reject on-chain'}
              </button>
            </>
          )
        ) : (
          <>
            <button
              type="button"
              className="request-link"
              onClick={() => {
                onDismiss(req.requestId)
                toast.info('Request dismissed locally')
              }}
            >
              Hide
            </button>
            <button
              type="button"
              className="request-btn request-btn--ghost"
              onClick={() => toast.success('Reminder sent')}
            >
              Remind
            </button>
          </>
        )}
      </div>
    </div>
  )
}
