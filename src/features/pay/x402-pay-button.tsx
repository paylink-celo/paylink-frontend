import { useState } from 'react'
import { useChainId, usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

import { backendFetch, hasBackend } from '@/lib/backend'
import { signX402Authorization } from '@/lib/x402/sign-eip3009'

/**
 * Gasless "pay via x402" button.
 *
 * The user signs an EIP-3009 `TransferWithAuthorization` (off-chain, no gas)
 * and the backend relayer submits `InvoiceVault.x402Pay(...)` on-chain. The
 * token itself verifies the signature in `transferWithAuthorization`, so the
 * user never needs to call `approve()` either.
 *
 * Rendered as a secondary CTA next to the regular Pay button. We hide it
 * entirely when the backend is not configured, since x402 relay requires a
 * reachable `POST /api/invoice/:vault/pay` endpoint.
 */
export function X402PayButton({
  vaultAddr,
  tokenAddr,
  from,
  amount,
  disabled,
  onDone,
}: {
  vaultAddr: `0x${string}`
  tokenAddr: `0x${string}`
  /** Connected wallet address. Kept explicit so the button can hide itself
   *  gracefully before the wallet connects. */
  from: `0x${string}` | undefined
  amount: bigint
  /** Parent can disable while its own tx is in flight. */
  disabled?: boolean
  onDone: () => void
}) {
  const chainId = useChainId()
  const publicClient = usePublicClient({ chainId })
  const { data: walletClient } = useWalletClient()
  const [phase, setPhase] = useState<'idle' | 'signing' | 'relaying'>('idle')

  // Feature flag: only surface x402 when backend is reachable. The backend
  // relayer is what actually submits the tx, so without it the button can't
  // do anything useful.
  if (!hasBackend()) return null
  if (!from) return null

  const busy = phase !== 'idle' || Boolean(disabled)

  async function pay() {
    if (!walletClient || !publicClient) {
      return toast.error('Wallet not ready yet')
    }
    if (!from) return toast.error('Connect wallet first')
    if (amount <= 0n) return toast.error('Enter an amount first')

    setPhase('signing')
    let auth
    try {
      auth = await signX402Authorization({
        walletClient,
        publicClient,
        tokenAddr,
        vault: vaultAddr,
        from,
        value: amount,
        chainId,
      })
    } catch (err) {
      setPhase('idle')
      const msg = err instanceof Error ? err.message : String(err)
      // Users cancelling in the wallet produce a noisy stack trace; surface a
      // clean, short explanation instead.
      toast.error(
        msg.includes('User rejected') || msg.includes('rejected')
          ? 'Signature cancelled'
          : 'Sign failed: ' + msg.split('\n')[0],
      )
      return
    }

    setPhase('relaying')
    try {
      const res = await backendFetch(`/api/invoice/${vaultAddr}/pay`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: auth.from,
          // The backend treats these as bigints encoded as strings to avoid
          // JSON precision loss.
          value: auth.value.toString(),
          validAfter: auth.validAfter.toString(),
          validBefore: auth.validBefore.toString(),
          nonce: auth.nonce,
          v: auth.v,
          r: auth.r,
          s: auth.s,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      toast.success('Paid via x402 \u2713 \u2014 no gas from your wallet')
      onDone()
    } catch (err) {
      toast.error(
        'x402 relay failed: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      setPhase('idle')
    }
  }

  return (
    <button
      type="button"
      className="btn-secondary flex w-full items-center justify-center gap-2 text-sm"
      onClick={pay}
      disabled={busy || amount <= 0n}
      title="Sign once off-chain \u2014 a relayer submits the tx and covers gas."
    >
      <Zap size={14} />
      {phase === 'signing'
        ? 'Sign in wallet\u2026'
        : phase === 'relaying'
          ? 'Relaying on-chain\u2026'
          : 'Pay gasless (x402)'}
    </button>
  )
}
