import { useEffect, useState } from 'react'
import { useConnection, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'sonner'

import { useVaultDeposit } from '@/hooks/mutation/use-vault-deposit'
import { InvoiceVaultAbi } from '@/lib/abis/invoice-vault-abi'
import { formatAmount } from '@/lib/format'

import { asInput, parseInput } from './helpers'
import { X402PayButton } from './x402-pay-button'

export function PayerActions({
  vaultAddr,
  tokenAddr,
  remaining,
  isOpen,
  canDecline,
  onDone,
}: {
  vaultAddr: `0x${string}`
  tokenAddr: `0x${string}`
  remaining: bigint
  isOpen: boolean
  /** Whether the "Decline invoice" action should be shown. We hide it for
   *  open-payment invoices since there's no personal obligation to refuse. */
  canDecline: boolean
  onDone: () => void
}) {
  const { address: me } = useConnection()
  const [input, setInput] = useState<string>('')
  const [confirmingDecline, setConfirmingDecline] = useState(false)
  const { status, mutation } = useVaultDeposit()

  useEffect(() => {
    if (!isOpen && input === '') setInput(asInput(remaining))
  }, [isOpen, remaining, input])

  // When deposit succeeds, refresh parent
  useEffect(() => {
    if (status === 'success') onDone()
  }, [status, onDone])

  // Separate wagmi channel for decline() — independent of the deposit flow so
  // the two cannot collide mid-tx.
  const { data: declineHash, writeContract: writeDecline, isPending: declinePending, error: declineError } = useWriteContract()
  const { isSuccess: declined, isLoading: declineMining } = useWaitForTransactionReceipt({ hash: declineHash })

  useEffect(() => {
    if (declined) {
      toast.success('Invoice declined \u2713')
      setConfirmingDecline(false)
      onDone()
    }
  }, [declined, onDone])

  useEffect(() => {
    if (declineError) {
      toast.error('Decline failed: ' + declineError.message.split('\n')[0])
      setConfirmingDecline(false)
    }
  }, [declineError])

  function pay() {
    if (!me) return toast.error('Connect wallet first')
    const amount = parseInput(input)
    if (amount <= 0n) return toast.error('Enter an amount')
    mutation.mutate({ vaultAddr, tokenAddr, amount })
  }

  function submitDecline() {
    writeDecline({
      abi: InvoiceVaultAbi as Abi,
      address: vaultAddr,
      functionName: 'decline',
    })
  }

  const busy = status === 'loading' || status === 'confirming' || declinePending || declineMining

  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Pay</p>
      <h3 className="text-base font-semibold text-[var(--sea-ink)]">Your share</h3>
      <p className="mt-1 mb-4 text-sm text-[var(--sea-ink-soft)]">
        {isOpen
          ? `Open invoice \u2014 contribute up to ${formatAmount(remaining)} remaining.`
          : `You owe ${formatAmount(remaining)}.`}
      </p>
      <div className="flex flex-col gap-3">
        <label>
          <span className="label">Amount</span>
          <input
            className="input"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
          />
        </label>
        <button className="btn-primary w-full" onClick={pay} disabled={busy}>
          {busy ? 'Processing\u2026' : 'Pay'}
        </button>
        <X402PayButton
          vaultAddr={vaultAddr}
          tokenAddr={tokenAddr}
          from={me}
          amount={parseInput(input)}
          disabled={busy}
          onDone={onDone}
        />
        {canDecline && !confirmingDecline && (
          <button
            type="button"
            className="btn-ghost w-full text-sm"
            onClick={() => setConfirmingDecline(true)}
            disabled={busy}
          >
            Decline invoice
          </button>
        )}
        {canDecline && confirmingDecline && (
          <div className="rounded-xl border border-[#F8DDD4] bg-[#FDEAE1] p-3">
            <p className="m-0 mb-2 text-sm font-semibold text-[#A4463A]">
              Decline this invoice?
            </p>
            <p className="m-0 mb-3 text-xs text-[var(--sea-ink-soft)]">
              Declining signals the creator that you won’t pay. They can then cancel the
              invoice. This is an on-chain action (costs a small amount of gas).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1 text-sm"
                onClick={() => setConfirmingDecline(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 text-sm"
                style={{ background: '#D9564A' }}
                onClick={submitDecline}
                disabled={busy}
              >
                {declineMining
                  ? 'Declining\u2026'
                  : declinePending
                    ? 'Signing\u2026'
                    : 'Confirm decline'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
