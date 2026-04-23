import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Low-level shimmer block used to compose content-shaped loading placeholders.
 *
 * Prefer composing feature-specific skeletons (e.g. `RequestCardSkeleton`)
 * instead of sprinkling raw `<Skeleton />` nodes across screens — consistent
 * geometry between skeleton and real content prevents layout shift when data
 * finally loads.
 *
 * Implementation: a simple Tailwind `animate-pulse` block tinted to match the
 * app's sand surface. No custom keyframes needed.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-[var(--sand-shadow,rgba(56,161,145,0.08))]',
        className,
      )}
      {...props}
    />
  )
}
