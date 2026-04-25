import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { RequestList } from '@/features/requests/request-list'

export const Route = createFileRoute('/requests')({ component: RequestsPage })

function RequestsPage() {
  return (
    <div className="page-enter page-wrap pb-24 pt-3">
      <PageHeader title="Requests" />
      <RequestList />
    </div>
  )
}
