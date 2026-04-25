import { TAB_META, type Tab } from './shared/types'

export function CreateTabs({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  const desc = TAB_META.find(([k]) => k === active)?.[2] ?? ''

  return (
    <div>
      <div className="segmented" role="tablist" aria-label="Invoice type">
        {TAB_META.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active === k}
            onClick={() => onChange(k)}
            className={`segmented-item ${active === k ? 'segmented-item--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 mb-4 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
    </div>
  )
}
