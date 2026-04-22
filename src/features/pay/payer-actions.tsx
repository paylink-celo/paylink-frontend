import { useEffect, useState } from 'react'
import { useConnection, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'
import { erc20Abi } from 'viem'
import { toast } from 'sonner'

import { InvoiceVaultAbi } from '@/lib/abis/factory-abi'
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
      toast.success('Payment sent \u2713')
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
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">Pay</p>
      <h3 className="text-base font-semibold text-[var(--sea-ink)]">Your share</h3>
      <p className="mt-1 mb-4 text-sm text-[var(--sea-ink-soft)]">
        {isOpen
          ? `Open invoice — contribute up to ${formatAmount(remaining)} remaining.`
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
          {phase === 'approving' ? 'Approving\u2026' : phase === 'depositing' ? 'Depositing\u2026' : 'Pay'}
        </button>
      </div>
    </section>
  )
}
