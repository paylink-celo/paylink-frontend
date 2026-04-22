export const SOFT_INPUT =
  'h-12 rounded-[14px] border-transparent bg-[color-mix(in_oklab,var(--sand)_55%,white_45%)] px-4 py-2 text-base text-[var(--sea-ink)] placeholder:text-[color-mix(in_oklab,var(--sea-ink-soft)_70%,white_30%)] focus-visible:border-[var(--lagoon)] focus-visible:ring-2 focus-visible:ring-[rgba(56,161,145,0.35)]'

export const SOFT_TEXTAREA = `${SOFT_INPUT} min-h-24 py-3`

export const SOFT_TRIGGER = `${SOFT_INPUT} w-full justify-between pr-3 data-[size=default]:h-12 [&[data-placeholder]]:text-[color-mix(in_oklab,var(--sea-ink-soft)_70%,white_30%)]`
