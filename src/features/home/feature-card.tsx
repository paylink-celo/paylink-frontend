import type { ReactNode } from 'react'

export type FeatureCardDecoVariant = 'teal' | 'warm' | 'neutral'

export function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  onClick,
  deco,
  decoVariant,
}: {
  icon: ReactNode
  iconBg: string
  iconColor: string
  title: string
  desc: string
  onClick: () => void
  deco?: string
  decoVariant?: FeatureCardDecoVariant
}) {
  const descWords = desc.split(' ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="island-shell feature-card rise-in press-scale h-[7.75rem] w-full rounded-3xl p-4 text-left sm:h-auto sm:p-5"
    >
      {deco && (
        <img
          src={deco}
          alt=""
          aria-hidden
          className={`feature-card__deco ${
            decoVariant ? `feature-card__deco--${decoVariant}` : ''
          }`}
        />
      )}
      <div className="feature-card__content flex items-center gap-3 sm:block">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor} sm:mb-4 sm:h-11 sm:w-11`}
        >
          {icon}
        </div>
        <div className="min-w-0 sm:block">
          <h2 className="text-sm font-bold leading-tight text-[var(--sea-ink)] sm:text-base">
            {title}
          </h2>
          <div className="mt-1 text-xs leading-snug text-[var(--sea-ink-soft)] sm:hidden">
            {descWords.map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </div>
          <p className="mt-0 hidden text-sm text-[var(--sea-ink-soft)] sm:block">{desc}</p>
        </div>
      </div>
    </button>
  )
}
