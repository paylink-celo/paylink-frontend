export function Banner({
  kind,
  title,
  body,
}: {
  kind: 'info' | 'ok'
  title: string
  body: string
}) {
  return (
    <section className="island-shell rounded-2xl p-5">
      <p
        className="island-kicker mb-2"
        style={{ color: kind === 'ok' ? 'var(--status-settled)' : 'var(--kicker)' }}
      >
        {kind === 'ok' ? '\u2713 ' : ''}
        {title}
      </p>
      <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{body}</p>
    </section>
  )
}
