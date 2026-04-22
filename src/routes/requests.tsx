import { createFileRoute } from '@tanstack/react-router'

import { RequestList } from '@/features/requests/request-list'

export const Route = createFileRoute('/requests')({ component: RequestsPage })

function RequestsPage() {
  return (
    <div className="page-wrap pb-24 pt-5">
      <RequestList />
    </div>
  )
}
