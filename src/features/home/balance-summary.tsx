import { useState } from 'react'

import { TokenSelector } from '@/components/token-selector'
import {
  useUserTokenBalance,
  TOKEN_DECIMALS,
} from '@/hooks/balance/use-token-balance'

const TOKEN_OPTIONS = ['cUSD', 'USDT'] as const
type TokenOption = (typeof TOKEN_OPTIONS)[number]

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })

export function BalanceSummary() {
  const [token, setToken] = useState<TokenOption>('cUSD')

  const cusd = useUserTokenBalance('cUSD', TOKEN_DECIMALS.cUSD)
  const usdt = useUserTokenBalance('USDT', TOKEN_DECIMALS.USDT)

  const balances: Record<TokenOption, number> = {
    cUSD: cusd.userTokenBalanceParsed,
    USDT: usdt.userTokenBalanceParsed,
  }

  return (
    <section className="balance-card rise-in mb-6">
      <img
        src="/Curve%20Line.svg"
        alt=""
        aria-hidden
        className="balance-card__deco"
      />
      <div className="balance-card__inner">
        <p className="balance-kicker mb-2">Total Balance</p>
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="balance-amount">
            {formatAmount(balances[token])}
          </span>
          <TokenSelector
            value={token}
            onChange={setToken}
            options={TOKEN_OPTIONS.map((symbol) => ({
              symbol,
              balance: balances[symbol],
            }))}
          />
        </div>
      </div>
    </section>
  )
}
