import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import { TokenIcon } from '@/components/token-icon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type TokenSelectorOption<T extends string = string> = {
  symbol: T
  balance: number
}

const formatAmount = (n: number) =>
  n.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })

/**
 * Pill-shaped popover used on the home & activity balance cards to switch
 * between supported stablecoin symbols. The trigger shows the selected token's
 * logo + symbol; the menu lists every option with its current balance.
 */
export function TokenSelector<T extends string>({
  value,
  onChange,
  options,
  triggerClassName,
}: {
  value: T
  onChange: (next: T) => void
  options: ReadonlyArray<TokenSelectorOption<T>>
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select token"
          className={
            triggerClassName ??
            'inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-white/70 px-2.5 py-1 text-sm font-semibold text-(--sea-ink) transition-colors hover:bg-white'
          }
        >
          <TokenIcon symbol={value} size={18} />
          <span>{value}</span>
          <ChevronDownIcon
            className={`size-3.5 opacity-60 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-56 gap-1 p-2">
        {options.map(({ symbol, balance }) => {
          const isSelected = symbol === value
          return (
            <button
              key={symbol}
              type="button"
              onClick={() => {
                onChange(symbol)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                isSelected ? 'bg-(--lagoon-soft)/60' : 'hover:bg-(--foam)'
              }`}
            >
              <span className="flex items-center gap-2">
                <TokenIcon symbol={symbol} size={22} />
                <span className="text-sm font-semibold text-(--sea-ink)">
                  {symbol}
                </span>
              </span>
              <span className="text-xs font-medium text-(--sea-ink-soft)">
                {formatAmount(balance)}
              </span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
