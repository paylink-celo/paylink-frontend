import type { Address } from "viem"

export type ChainAddresses = {
  factory: `0x${string}` | ""
  cUSD: `0x${string}` | ""
  USDT: `0x${string}` | ""
  /** PayerPolicy contract address. Empty until deployed; fall back to on-chain `factory.policyContract()` at runtime. */
  policyContract: `0x${string}` | ""
}

export const addresses: Record<number, ChainAddresses> = {
  11142220: {
    factory: '0x492338d4728e07ab3ec126aeff8FDce030739421' as Address,
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as Address,
    USDT: '0xd077A400968890Eacc75cdc901F0356c943e4fDb' as Address,
    policyContract: '0xa02DC5E5aBE74142aA1fDdB5bC43052e81a8A958' as const,
  },
  42220: {
    factory: '' as const,
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
    USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as Address,
    policyContract: '' as const,
  },
}

export function getAddresses(chainId: number): ChainAddresses {
  return addresses[chainId] ?? { factory: '', cUSD: '', USDT: '', policyContract: '' }
}
