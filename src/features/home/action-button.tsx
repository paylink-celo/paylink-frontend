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
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-95 ${
          primary
            ? 'bg-[linear-gradient(135deg,#38A191,#2e8a7c)] shadow-[0_8px_24px_rgba(56,161,145,0.3)]'
            : 'island-shell'
        }`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-[var(--sea-ink)]">{label}</span>
    </button>
  )
}
