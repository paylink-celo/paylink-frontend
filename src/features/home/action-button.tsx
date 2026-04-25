import type { ReactNode } from 'react'

export function ActionButton({
  icon,
  label,
  primary,
  onClick,
}: {
  icon: ReactNode
  label: string
  primary?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 group-active:scale-90 group-hover:-translate-y-0.5 ${
          primary
            ? 'bg-[linear-gradient(135deg,#38A191,#2e8a7c)] shadow-[0_8px_24px_rgba(56,161,145,0.3)] group-hover:shadow-[0_12px_28px_rgba(56,161,145,0.4)]'
            : 'island-shell group-hover:shadow-[0_12px_28px_rgba(30,90,72,0.12)]'
        }`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-[var(--sea-ink)] transition-colors group-hover:text-[var(--lagoon-deep)]">
        {label}
      </span>
    </button>
  )
}
