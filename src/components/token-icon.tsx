type TokenSymbolLike = 'cUSD' | 'USDT' | string

const LOGOS: Record<string, string> = {
  cUSD: '/cUSD.png',
  USDT: '/usdt.png',
}

/**
 * Renders the canonical logo for a stablecoin symbol (cUSD / USDT) from /public.
 * Falls back to a neutral circle with the first letter when the symbol is unknown.
 */
export function TokenIcon({
  symbol,
  size = 24,
  className,
}: {
  symbol: TokenSymbolLike
  size?: number
  className?: string
}) {
  const src = LOGOS[symbol]
  if (src) {
    return (
      <img
        src={src}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={className}
        style={{ borderRadius: '9999px' }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        background: '#e5e7eb',
        color: '#4b5563',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.max(10, Math.round(size * 0.5)),
      }}
    >
      {symbol.charAt(0) || '?'}
    </span>
  )
}
