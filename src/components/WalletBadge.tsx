import { useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { truncateAddress } from '../lib/format'
import { detectMiniPay } from '../lib/minipay'
import { activeChain } from '../lib/chains'

export default function WalletBadge() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Auto-connect when running inside the MiniPay in-app browser.
  useEffect(() => {
    if (!isConnected && detectMiniPay()) {
      const injectedConnector = connectors.find((c) => c.type === 'injected')
      if (injectedConnector) {
        void connect({ connector: injectedConnector })
      }
    }
  }, [isConnected, connectors, connect])

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        className="btn-primary"
        disabled={isPending}
        onClick={() => {
          const injectedConnector = connectors.find((c) => c.type === 'injected')
          if (injectedConnector) {
            connect({ connector: injectedConnector })
          } else if (connectors[0]) {
            connect({ connector: connectors[0] })
          }
        }}
      >
        {isPending ? 'Connecting…' : 'Connect wallet'}
      </button>
    )
  }

  const wrongNetwork = chainId !== activeChain.id

  if (wrongNetwork) {
    return (
      <button
        type="button"
        className="btn-secondary"
        onClick={() => switchChain({ chainId: activeChain.id })}
      >
        Switch to {activeChain.name}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)]">
        <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
        {truncateAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="btn-ghost"
        aria-label="Disconnect"
        title="Disconnect"
      >
        ⎋
      </button>
    </div>
  )
}
