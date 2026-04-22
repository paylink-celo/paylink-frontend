import { useNavigate } from '@tanstack/react-router'
import { useChainId, useConnection, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react'

import { getAddresses } from '@/lib/addresses/addresses'
import { formatAmount } from '@/lib/format'

export function BalanceCard() {
  const { address } = useConnection()
  const chainId = useChainId()
  const { cUSD } = getAddresses(chainId)
  const navigate = useNavigate()

  const { data: cUsdBalance } = useReadContract({
    address: cUSD as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && cUSD) },
  })

  return (
    <section className="balance-card rise-in mb-6">
      <p className="balance-kicker">TOTAL BALANCE</p>
      <p className="balance-amount">
        {cUsdBalance !== undefined ? formatAmount(cUsdBalance) : '0.00'}
      </p>
      <p className="balance-symbol">cUSD</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          className="balance-action balance-action--primary"
          onClick={() => navigate({ to: '/create', search: { tab: 'pull' } })}
        >
          <ArrowDownToLine size={16} />
          Receive
        </button>
        <button
          type="button"
          className="balance-action balance-action--ghost"
          onClick={() => navigate({ to: '/create' })}
        >
          <ArrowUpRight size={16} />
          Send
        </button>
      </div>
    </section>
  )
}
