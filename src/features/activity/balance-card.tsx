import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/solid'

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

export function BalanceCard() {
  const navigate = useNavigate()
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
        <p className="balance-kicker">TOTAL BALANCE</p>
        <p className="balance-amount">{formatAmount(balances[token])}</p>
        <TokenSelector
          value={token}
          onChange={setToken}
          options={TOKEN_OPTIONS.map((symbol) => ({
            symbol,
            balance: balances[symbol],
          }))}
        />
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            className="balance-action balance-action--primary"
            onClick={() => navigate({ to: '/create', search: { tab: 'pull' } })}
          >
            <ArrowDownTrayIcon className="size-4" />
            Receive
          </button>
          <button
            type="button"
            className="balance-action balance-action--ghost"
            onClick={() => navigate({ to: '/create' })}
          >
            <PaperAirplaneIcon className="size-4 -rotate-45" />
            Send
          </button>
        </div>
      </div>
    </section>
  )
}
