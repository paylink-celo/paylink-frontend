import * as React from 'react'

import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'shimmer rounded-md',
        className,
      )}
      {...props}
    />
  )
}
