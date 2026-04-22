import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Calendar, CheckCircle2 } from 'lucide-react'

import { useConfirmRequest } from '@/hooks/mutation/use-confirm-request'
import { truncateAddress } from '@/lib/format'

import { avatarToneFor, displayNameFor } from './helpers'
import { RequestHeader } from './request-header'
import type { InvoiceRequest } from './types'

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
  const [expanded, setExpanded] = useState(false)
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const { status: txStatus, mutation, vaultAddr: createdVault } = useConfirmRequest()
  const busy = txStatus === 'loading' || txStatus === 'confirming'

  // Navigate to vault on success
  useEffect(() => {
    if (txStatus === 'success' && createdVault) {
      setTimeout(() => navigate({ to: '/pay/$vault', params: { vault: createdVault } }), 300)
    }
  }, [txStatus, createdVault, navigate])

  function confirm() {
    if (!due) return toast.error('Pick a due date')
    if (Date.parse(due) <= Date.now()) return toast.error('Due date must be in the future')
    mutation.mutate({
      factory,
      requestId: req.requestId,
      token: cUSD,
      dueDate: BigInt(Math.floor(Date.parse(due) / 1000)),
      metadataURI: note || 'paylink://pull',
    })
  }

  const displayName = displayNameFor(req.counterparty)
  const subtitle = req.notes?.trim() || truncateAddress(req.counterparty)
  const avatarTone = avatarToneFor(req.counterparty)

  if (req.fulfilledVault) {
    return (
      <Link
        to="/pay/$vault"
        params={{ vault: req.fulfilledVault }}
        className="request-card no-underline text-inherit"
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
            <CheckCircle2 size={14} /> Completed
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="request-card">
      <RequestHeader
        direction={req.direction}
        name={displayName}
        subtitle={subtitle}
        amount={req.amount}
        avatarTone={avatarTone}
      />

      {req.direction === 'incoming' && expanded && (
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

      <div className="request-divider" />

      <div className="flex items-center justify-end gap-3 pt-3">
        {req.direction === 'incoming' ? (
          <>
            <button
              type="button"
              className="request-link"
              onClick={() => {
                onDismiss(req.requestId)
                toast.info('Request declined')
              }}
            >
              Decline
            </button>
            {!expanded ? (
              <button
                type="button"
                className="request-btn request-btn--primary"
                onClick={() => setExpanded(true)}
              >
                Pay
              </button>
            ) : (
              <button
                type="button"
                className="request-btn request-btn--primary"
                onClick={confirm}
                disabled={busy}
              >
                {busy ? 'Processing\u2026' : 'Confirm'}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className="request-link"
              onClick={() => {
                onDismiss(req.requestId)
                toast.info('Request cancelled locally')
              }}
            >
              Cancel
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
