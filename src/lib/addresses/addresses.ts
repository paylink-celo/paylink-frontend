
import type { Address } from "viem"

export type ChainAddresses = {
  factory: `0x${string}` | ""
  cUSD: `0x${string}` | ""
  USDT: `0x${string}` | ""
}

export const addresses: Record<number, ChainAddresses> = {
  11142220: {
    factory: '0x4C3B53634a5f81cA03BCa894C91A1bC6733a76ad' as Address,
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as Address,
    USDT: '0xd077A400968890Eacc75cdc901F0356c943e4fDb' as Address,
  },
  42220: {
    factory: '' as const,
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
    USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as Address,
  },
}

export function getAddresses(chainId: number): ChainAddresses { return addresses[chainId] ?? { factory: '', cUSD: '', USDT: '' } }