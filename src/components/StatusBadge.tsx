import { statusLabel, statusColor } from '../lib/format'

export default function StatusBadge({ status }: { status: number }) {
  const cls = statusColor(status)
  const label = statusLabel(status)
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: `color-mix(in oklab, var(--${cls}) 14%, white)`,
        color: `var(--${cls})`,
        border: `1px solid color-mix(in oklab, var(--${cls}) 34%, transparent)`,
      }}
    >
      <span className="status-dot" style={{ backgroundColor: `var(--${cls})` }} />
      {label}
    </span>
  )
}
