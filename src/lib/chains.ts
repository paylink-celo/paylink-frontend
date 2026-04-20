import { celo, celoSepolia } from 'viem/chains'

/**
 * Active chain for the frontend. Controlled via `VITE_CHAIN_ID` so we can point
 * a preview build at mainnet without code changes.
 */
const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID ?? celoSepolia.id)

export const activeChain = configuredChainId === celo.id ? celo : celoSepolia

export const supportedChains = [celoSepolia, celo] as const

export const explorerUrl = (address: string) =>
  `${activeChain.blockExplorers?.default.url.replace(/\/$/, '')}/address/${address}`

export const txExplorerUrl = (hash: string) =>
  `${activeChain.blockExplorers?.default.url.replace(/\/$/, '')}/tx/${hash}`
