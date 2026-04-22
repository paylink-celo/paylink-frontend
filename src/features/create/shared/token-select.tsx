import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TokenIcon } from '@/components/token-icon'

import { SOFT_TRIGGER } from './styles'
import type { TokenSymbol } from './types'

export function TokenSelect({
  value,
  onChange,
}: {
  value: TokenSymbol
  onChange: (v: TokenSymbol) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TokenSymbol)}>
      <SelectTrigger className={SOFT_TRIGGER} aria-label="Token">
        <SelectValue placeholder="Select token" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cUSD">
          <span className="flex items-center gap-2">
            <TokenIcon symbol="cUSD" size={20} /> cUSD
          </span>
        </SelectItem>
        <SelectItem value="USDT">
          <span className="flex items-center gap-2">
            <TokenIcon symbol="USDT" size={20} /> USDT
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
