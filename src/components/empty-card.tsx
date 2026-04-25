import type { ReactNode } from 'react'

const illustrations: Record<string, ReactNode> = {
  activity: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(56,161,145,0.08)" />
      <circle cx="40" cy="40" r="24" fill="rgba(56,161,145,0.06)" />
      <path d="M28 44l8-12 8 8 8-14" stroke="var(--lagoon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="44" r="3" fill="var(--lagoon-soft)" stroke="var(--lagoon)" strokeWidth="1.5" />
      <circle cx="36" cy="32" r="3" fill="var(--lagoon-soft)" stroke="var(--lagoon)" strokeWidth="1.5" />
      <circle cx="44" cy="40" r="3" fill="var(--lagoon-soft)" stroke="var(--lagoon)" strokeWidth="1.5" />
      <circle cx="52" cy="26" r="3" fill="var(--lagoon-soft)" stroke="var(--lagoon)" strokeWidth="1.5" />
    </svg>
  ),
  requests: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(56,161,145,0.08)" />
      <rect x="24" y="22" width="32" height="36" rx="6" fill="rgba(56,161,145,0.06)" stroke="var(--lagoon)" strokeWidth="2" />
      <path d="M32 34h16M32 40h12M32 46h8" stroke="var(--lagoon-soft)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="54" cy="54" r="10" fill="var(--lagoon)" />
      <path d="M51 54h6M54 51v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  wallet: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(56,161,145,0.08)" />
      <rect x="18" y="28" width="44" height="28" rx="6" fill="rgba(56,161,145,0.06)" stroke="var(--lagoon)" strokeWidth="2" />
      <rect x="46" y="36" width="16" height="12" rx="4" fill="var(--lagoon-soft)" stroke="var(--lagoon)" strokeWidth="1.5" />
      <circle cx="54" cy="42" r="2.5" fill="var(--lagoon)" />
      <path d="M22 28l8-6h20l8 6" stroke="var(--lagoon)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  bills: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="rgba(56,161,145,0.08)" />
      <path d="M26 24h28a4 4 0 014 4v24a4 4 0 01-4 4H26a4 4 0 01-4-4V28a4 4 0 014-4z" fill="rgba(56,161,145,0.06)" stroke="var(--lagoon)" strokeWidth="2" />
      <path d="M30 36h20M30 42h14M30 48h8" stroke="var(--lagoon-soft)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="14" fill="none" stroke="var(--lagoon)" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  ),
}

export function EmptyCard({
  title,
  body,
  illustration = 'activity',
}: {
  title: string
  body: string
  illustration?: keyof typeof illustrations
}) {
  return (
    <div className="island-shell rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-3 flex justify-center">
        {illustrations[illustration] ?? illustrations.activity}
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">{title}</h3>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{body}</p>
    </div>
  )
}
