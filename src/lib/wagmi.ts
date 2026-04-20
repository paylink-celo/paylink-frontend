import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { supportedChains, activeChain } from './chains'

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
const sepoliaRpc = (import.meta.env.VITE_CELO_SEPOLIA_RPC_URL as string | undefined) ??
  'https://forno.celo-sepolia.celo-testnet.org'
const mainnetRpc = (import.meta.env.VITE_CELO_RPC_URL as string | undefined) ?? 'https://forno.celo.org'

const baseConnectors = [
  injected({ shimDisconnect: true, target: 'metaMask' }),
  injected({ shimDisconnect: true }),
]

const connectors = wcProjectId
  ? [
      ...baseConnectors,
      walletConnect({
        projectId: wcProjectId,
        showQrModal: true,
        metadata: {
          name: 'PayLink',
          description: 'On-chain billing for MiniPay',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://paylink.app',
          icons: [],
        },
      }),
    ]
  : baseConnectors

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    [supportedChains[0].id]: http(sepoliaRpc),
    [supportedChains[1].id]: http(mainnetRpc),
  },
  ssr: false,
})

export { activeChain }
