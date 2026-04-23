import type { PublicClient, WalletClient } from 'viem'
import { parseSignature } from 'viem'

/**
 * Sign an EIP-3009 `TransferWithAuthorization` so a backend relayer can call
 * `InvoiceVault.x402Pay(...)` on the user's behalf — the user only pays a
 * signature, not gas.
 *
 * Flow:
 *   1. Read the token's EIP-712 domain via EIP-5267 `eip712Domain()`, with a
 *      static fallback for known Celo stablecoins that don't expose it.
 *   2. Build the typed-data message with the vault as `to`, the user's
 *      address as `from`, and a random 32-byte nonce.
 *   3. Ask the wallet to sign with `signTypedData`.
 *   4. Split the 65-byte signature into `{ v, r, s }` so the relayer can
 *      forward them as the corresponding arguments to `x402Pay`.
 */

const TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const

export type X402Authorization = {
  from: `0x${string}`
  to: `0x${string}`
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: `0x${string}`
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

// Minimal ABI for EIP-5267 — most modern ERC-20 on Celo expose this.
const EIP5267_ABI = [
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

type Domain = {
  name: string
  version: string
  chainId: number
  verifyingContract: `0x${string}`
}

async function readDomain(
  publicClient: PublicClient,
  tokenAddr: `0x${string}`,
  chainId: number,
): Promise<Domain> {
  try {
    const res = await publicClient.readContract({
      address: tokenAddr,
      abi: EIP5267_ABI,
      functionName: 'eip712Domain',
    })
    // viem decodes tuple outputs as a typed tuple; positional access works.
    const name = res[1]
    const version = res[2]
    const verifyingContract = res[4] as `0x${string}`
    return { name, version, chainId, verifyingContract }
  } catch {
    // Known Celo stablecoin fallbacks. Keep in sync with features/pay/helpers.ts.
    const lower = tokenAddr.toLowerCase()
    if (
      lower === '0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b' ||
      lower === '0x765de816845861e75a25fca122bb6898b8b1282a'
    ) {
      return { name: 'Celo Dollar', version: '1', chainId, verifyingContract: tokenAddr }
    }
    if (
      lower === '0xd077a400968890eacc75cdc901f0356c943e4fdb' ||
      lower === '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e'
    ) {
      return { name: 'Tether USD', version: '1', chainId, verifyingContract: tokenAddr }
    }
    throw new Error('Token does not expose EIP-712 domain for x402 signing')
  }
}

function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return ('0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')) as `0x${string}`
}

export async function signX402Authorization(params: {
  walletClient: WalletClient
  publicClient: PublicClient
  tokenAddr: `0x${string}`
  from: `0x${string}`
  /** Vault address — acts as `to` for the transfer. */
  vault: `0x${string}`
  value: bigint
  chainId: number
  /** Authorization lifetime window, seconds. Default 15 minutes. */
  validitySeconds?: number
}): Promise<X402Authorization> {
  const validityS = params.validitySeconds ?? 15 * 60
  const validAfter = 0n
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + validityS)
  const nonce = randomNonce()

  const domain = await readDomain(params.publicClient, params.tokenAddr, params.chainId)

  const message = {
    from: params.from,
    to: params.vault,
    value: params.value,
    validAfter,
    validBefore,
    nonce,
  }

  const signature = await params.walletClient.signTypedData({
    account: params.from,
    domain,
    types: TYPES,
    primaryType: 'TransferWithAuthorization',
    message,
  })

  const sig = parseSignature(signature)
  // Some wallets return v as 0/1 (yParity). The vault expects 27/28.
  const rawV = Number(sig.v ?? sig.yParity)
  const v = rawV < 27 ? rawV + 27 : rawV

  return {
    from: params.from,
    to: params.vault,
    value: params.value,
    validAfter,
    validBefore,
    nonce,
    v,
    r: sig.r,
    s: sig.s,
  }
}
