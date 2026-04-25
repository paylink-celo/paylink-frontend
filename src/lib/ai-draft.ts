import type { AiDraft } from './api'

const KEY = 'payme.ai-draft.v1'

export function saveDraft(draft: AiDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // sessionStorage disabled (private mode) — silently ignore
  }
}

export function loadDraft(): AiDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AiDraft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
