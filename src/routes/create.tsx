import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { clearDraft, loadDraft } from '@/lib/ai-draft'
import { CreateHeader } from '@/features/create/create-header'
import { CreatePanel } from '@/features/create/create-panel'
import { CreateTabs } from '@/features/create/create-tabs'
import { TAB_VALUES, type AiDraft, type Tab } from '@/features/create/shared/types'

export const Route = createFileRoute('/create')({
  component: CreatePage,
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const raw = search.tab
    if (typeof raw === 'string' && (TAB_VALUES as readonly string[]).includes(raw)) {
      return { tab: raw as Tab }
    }
    return {}
  },
})

function CreatePage() {
  const search = Route.useSearch()
  const [initialDraft] = useState<AiDraft | null>(() => {
    const d = loadDraft()
    if (d) clearDraft()
    return d
  })
  const [tab, setTab] = useState<Tab>(initialDraft?.mode ?? search.tab ?? 'pull')

  return (
    <div className="page-wrap pb-24 pt-6">
      <CreateHeader />
      <CreateTabs active={tab} onChange={setTab} />
      <CreatePanel tab={tab} aiDraft={initialDraft} />
    </div>
  )
}
