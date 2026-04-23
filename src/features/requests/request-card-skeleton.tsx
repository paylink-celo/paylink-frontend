import { Skeleton } from '@/components/ui/skeleton'

/**
 * Placeholder with the same geometry as `<RequestCard>` so the transition
 * from loading → loaded doesn't cause layout shift.
 *
 * Dimensions mirror `request-header.tsx`:
 *   - 12x12 avatar circle
 *   - direction label (small pill) + name line + subtitle line
 *   - amount on the right
 *   - divider + button row
 */
export function RequestCardSkeleton() {
  return (
    <div className="request-card" aria-busy>
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="mt-2 h-4 w-32 rounded" />
          <Skeleton className="mt-1.5 h-3 w-40 rounded" />
        </div>
        <div className="shrink-0 text-right">
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
      <div className="request-divider" />
      <div className="flex items-center justify-end gap-3 pt-3">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  )
}
