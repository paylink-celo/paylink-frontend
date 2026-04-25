import { createFileRoute } from '@tanstack/react-router'

import { ActionRow } from '@/features/home/action-row'
import { BalanceSummary } from '@/features/home/balance-summary'
import { FeatureGrid } from '@/features/home/feature-grid'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="page-enter px-4 pb-24 pt-4">
      <BalanceSummary />
      <ActionRow />
      <FeatureGrid />
    </div>
  )
}
