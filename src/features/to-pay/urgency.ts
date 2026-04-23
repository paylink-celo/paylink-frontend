import type { ToPayItem } from '@/hooks/graphql/use-my-to-pay'

/**
 * Human label for how urgent an obligation is.
 * Examples: "Overdue 3 days", "Due today", "Due tomorrow", "Due in 5 days".
 */
export function urgencyLabel(item: Pick<ToPayItem, 'daysUntilDue'>): string {
  const d = item.daysUntilDue
  if (d < 0) return `Overdue ${-d} day${-d === 1 ? '' : 's'}`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `Due in ${d} days`
}

/** Tailwind classes for pill background+foreground, aligned with design tokens. */
export function urgencyChipClass(urgency: ToPayItem['urgency']): string {
  switch (urgency) {
    case 'overdue':
      return 'bg-[#F8DDD4] text-[#A4463A]'
    case 'dueSoon':
      return 'bg-[#FDE8CC] text-[#B9603A]'
    default:
      return 'bg-[rgba(56,161,145,0.18)] text-[var(--lagoon-deep)]'
  }
}

/** Icon dot color for the same urgency scale — used by nav badge. */
export function urgencyDotClass(urgency: ToPayItem['urgency']): string {
  switch (urgency) {
    case 'overdue':
      return 'bg-[#D9564A]'
    case 'dueSoon':
      return 'bg-[#E08043]'
    default:
      return 'bg-[var(--lagoon-deep)]'
  }
}
