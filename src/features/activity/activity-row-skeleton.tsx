import { Skeleton } from '@/components/ui/skeleton'

/**
 * Placeholder matching `<ActivityRow>` geometry:
 *   - 11x11 icon circle on the left
 *   - title + counterparty line
 *   - amount + currency + status badge stacked on the right
 */
export function ActivityRowSkeleton() {
  return (
    <div className="activity-row" aria-busy>
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="mt-1.5 h-3 w-28 rounded" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  )
}
