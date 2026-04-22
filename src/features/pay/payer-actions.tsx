import { useEffect, useState } from 'react'
import { useConnection } from 'wagmi'
import { toast } from 'sonner'

import { useVaultDeposit } from '@/hooks/mutation/use-vault-deposit'
import { formatAmount } from '@/lib/format'

import { asInput, parseInput } from './helpers'

export function PayerActions({
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
  const { address: me } = useConnection()
  const [input, setInput] = useState<string>('')
  const { status, mutation } = useVaultDeposit()

  useEffect(() => {
    if (!isOpen && input === '') setInput(asInput(remaining))
  }, [isOpen, remaining, input])

  // When deposit succeeds, refresh parent
  useEffect(() => {
    if (status === 'success') onDone()
  }, [status, onDone])

  function pay() {
    if (!me) return toast.error('Connect wallet first')
    const amount = parseInput(input)
    if (amount <= 0n) return toast.error('Enter an amount')
    mutation.mutate({ vaultAddr, tokenAddr, amount })
  }

  const busy = status === 'loading' || status === 'confirming'

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
      </div>
    </section>
  )
}
