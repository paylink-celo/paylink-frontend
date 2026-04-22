import { useState } from 'react'
import { Bot } from 'lucide-react'
import { erc20Abi, parseSignature, bytesToHex } from 'viem'
import { useConnection, usePublicClient, useSignTypedData } from 'wagmi'
import { toast } from 'sonner'

import CopyButton from '@/components/copy-button'
import {
  getX402Requirements,
  postX402Payment,
  x402PayUrl,
  type X402AuthPayload,
} from '@/lib/api'
import { txExplorerUrl } from '@/lib/chains'

/**
 * OpenZeppelin ERC-5267 `eip712Domain()` — supported by most modern
 * stablecoins (StableTokenV2, USDC/FiatToken v2, …). We fall back to
 * `name()` + version "1" when unavailable.
 */
const eip712DomainAbi = [
  {
    type: 'function',
    name: 'eip712Domain',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'fields', type: 'bytes1' },
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'extensions', type: 'uint256[]' },
    ],
  },
] as const

const transferWithAuthorizationTypes = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const

function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

export function AgentX402Panel({ vaultAddr }: { vaultAddr: `0x${string}` }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'discovering' | 'signing' | 'relaying'>('idle')
  const [result, setResult] = useState<{ txHash: `0x${string}`; explorer?: string } | null>(null)

  const url = x402PayUrl(vaultAddr)
  const { address: me, isConnected } = useConnection()
  const publicClient = usePublicClient()
  const { signTypedDataAsync } = useSignTypedData()

  async function payWithWallet() {
    if (!me || !isConnected) {
      toast.error('Connect your wallet first')
      return
    }
    if (!publicClient) {
      toast.error('RPC client unavailable')
      return
    }
    setResult(null)
    try {
      // 1) Discover payment requirements via 402.
      setPhase('discovering')
      const req = await getX402Requirements(vaultAddr)
      if (req.scheme !== 'eip-3009') {
        throw new Error(`Unsupported scheme: ${req.scheme}`)
      }

      // 2) Resolve the token's EIP-712 domain (name + version).
      let name: string
      let version: string
      try {
        const domain = await publicClient.readContract({
          address: req.token,
          abi: eip712DomainAbi,
          functionName: 'eip712Domain',
        })
        name = domain[1] as string
        version = domain[2] as string
      } catch {
        name = (await publicClient.readContract({
          address: req.token,
          abi: erc20Abi,
          functionName: 'name',
        })) as string
        version = '1'
      }

      // 3) Build the authorization and ask the wallet to sign it.
      setPhase('signing')
      const now = Math.floor(Date.now() / 1000)
      const validAfter = 0n
      const validBefore = BigInt(now + 3600) // 1h window
      const nonce = randomNonce()

      const signature = await signTypedDataAsync({
        domain: {
          name,
          version,
          chainId: req.chainId,
          verifyingContract: req.token,
        },
        types: transferWithAuthorizationTypes,
        primaryType: 'TransferWithAuthorization',
        message: {
          from: me,
          to: req.recipient,
          value: req.amount,
          validAfter,
          validBefore,
          nonce,
        },
      })

      const { r, s, v } = parseSignature(signature)
      if (v === undefined) throw new Error('Missing v in signature')

      // 4) Relay the signed authorization via backend.
      setPhase('relaying')
      const payload: X402AuthPayload = {
        from: me,
        value: req.amount.toString(),
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
        v: Number(v),
        r,
        s,
      }
      const relayed = await postX402Payment(vaultAddr, payload)
      setResult({
        txHash: relayed.txHash,
        explorer: relayed.explorer ?? txExplorerUrl(relayed.txHash),
      })
      toast.success('Payment relayed ✓')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to pay via x402')
    } finally {
      setPhase('idle')
    }
  }

  const busy = phase !== 'idle'
  const busyLabel =
    phase === 'discovering'
      ? 'Fetching terms…'
      : phase === 'signing'
        ? 'Sign in wallet…'
        : phase === 'relaying'
          ? 'Relaying…'
          : 'Pay with my wallet'

  return (
    <section className="island-shell rounded-2xl p-5 mt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between bg-transparent p-0 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <p className="island-kicker m-0 flex items-center gap-1">
          <Bot size={12} /> Pay with AI agent (x402)
        </p>
        <span className="text-sm text-[var(--sea-ink-soft)]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            AI agents can discover payment terms via HTTP 402 and settle with an EIP-3009 signed
            authorization — no wallet connection required on their side.
          </p>
          <code className="break-all">{url}</code>
          <CopyButton value={url} label="Copy URL" />

          <div className="mt-2 border-t border-[var(--sea-ink-soft)]/20 pt-3">
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              Or sign the authorization with <strong>your wallet</strong> and let the relayer
              submit it. Gas is paid by the backend.
            </p>
            <button
              type="button"
              className="btn-primary mt-2 w-full"
              onClick={payWithWallet}
              disabled={busy || !isConnected}
            >
              {busyLabel}
            </button>
            {result && (
              <p className="mt-2 m-0 text-xs text-[var(--sea-ink-soft)]">
                Paid ·{' '}
                <a
                  href={result.explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--lagoon-deep)]"
                >
                  view tx ↗
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
