import type { PublicClient, WalletClient } from 'viem'
import { parseSignature } from 'viem'

/**
 * Sign an EIP-3009 `TransferWithAuthorization` so a backend relayer can call
 * `InvoiceVault.x402Pay(...)` on the user's behalf — the user only pays a
 * signature, not gas.
 *
 * Flow:
 *   1. Resolve the token's EIP-712 domain by calling `name()` and `version()`
 *      on the token contract. This MUST match what the backend verifier does
 *      in `x402-prevalidate.ts`, otherwise the recovered address will differ
 *      from `from` and the relay will reject the payload.
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

// IMPORTANT: we resolve the EIP-712 domain the same way the backend verifier
// does — reading `name()` and `version()` directly from the token contract.
// An earlier attempt used `eip712Domain()` (EIP-5267) with hard-coded string
// fallbacks, but some Celo stablecoin deployments omit EIP-5267 and the
// fallback names (e.g. "Celo Dollar") don't match what the token actually
// publishes — the recovered signer then ends up being a different address,
// failing `preValidateX402`.
const NAME_VERSION_ABI = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'version',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
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
  const [nameRes, versionRes] = await publicClient.multicall({
    allowFailure: true,
    contracts: [
      { address: tokenAddr, abi: NAME_VERSION_ABI, functionName: 'name' },
      { address: tokenAddr, abi: NAME_VERSION_ABI, functionName: 'version' },
    ],
  })
  if (nameRes.status !== 'success') {
    throw new Error(
      `Token ${tokenAddr} does not expose name() — cannot sign x402 authorization`,
    )
  }
  const name = nameRes.result as string
  // EIP-3009 tokens without an explicit `version()` conventionally use "1".
  // Backend applies the same default, so the two must agree.
  const version = versionRes.status === 'success' ? (versionRes.result as string) : '1'
  return { name, version, chainId, verifyingContract: tokenAddr }
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
