import { useConnection, useChainId, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { TrendingUp } from 'lucide-react'

import { getAddresses } from '@/lib/addresses/addresses'
import { formatAmount } from '@/lib/format'

export function BalanceSummary() {
  const { address } = useConnection()
  const chainId = useChainId()
  const addrs = getAddresses(chainId)

  const { data: cUsdBalance } = useReadContract({
    address: addrs.cUSD as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && addrs.cUSD) },
  })

  return (
    <section className="island-shell rise-in rounded-3xl px-6 py-6 text-center mb-6">
      <p className="island-kicker mb-2">Total Balance</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-sm font-semibold text-[var(--sea-ink-soft)]">cUSD</span>
        <span className="display-title text-4xl font-bold text-[var(--sea-ink)]">
          {cUsdBalance !== undefined ? formatAmount(cUsdBalance) : '0.00'}
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--lagoon-soft)] px-3 py-1">
        <TrendingUp size={14} className="text-[var(--lagoon-deep)]" />
        <span className="text-sm font-medium text-[var(--lagoon-deep)]">PayLink on Celo</span>
      </div>
    </section>
  )
}
