import { AgentChat } from './forms/agent-chat'
import { PullForm } from './forms/pull-form'
import { PushForm } from './forms/push-form'
import { SplitForm } from './forms/split-form'
import type { AiDraft, Tab } from './shared/types'

export function CreatePanel({ tab, aiDraft }: { tab: Tab; aiDraft: AiDraft | null }) {
  if (tab === 'push') {
    return <PushForm prefill={aiDraft?.mode === 'push' ? aiDraft : undefined} />
  }
  if (tab === 'split') {
    return <SplitForm prefill={aiDraft?.mode === 'split' ? aiDraft : undefined} />
  }
  if (tab === 'pull') {
    return <PullForm prefill={aiDraft?.mode === 'pull' ? aiDraft : undefined} />
  }
  return <AgentChat />
}
