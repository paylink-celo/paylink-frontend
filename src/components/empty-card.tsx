export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="island-shell rounded-2xl p-6 text-center">
      <h3 className="mb-1 text-base font-semibold text-[var(--sea-ink)]">{title}</h3>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{body}</p>
    </div>
  )
}
