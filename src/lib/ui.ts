const inputBase =
  'w-full border border-line bg-card text-ink shadow-sm transition placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60'

export const inputClass = `${inputBase} rounded-xl px-3.5 py-2.5`

export const searchClass = `${inputBase} rounded-full py-3 pl-12 pr-11 [&::-webkit-search-cancel-button]:hidden`

const btnBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition active:scale-[0.98] disabled:opacity-50 sm:min-h-10'

export const btn = `${btnBase} border border-line bg-card font-medium text-ink hover:border-accent/50 hover:bg-accent-soft`

export const btnActive = `${btnBase} border border-accent bg-accent-soft font-medium text-accent hover:brightness-95`

export const btnPrimary = `${btnBase} bg-accent font-semibold text-accent-ink shadow-sm hover:brightness-110`

export const btnDanger = `${btnBase} border border-line bg-card font-medium text-ink hover:border-danger/50 hover:bg-danger-soft hover:text-danger`

export const iconBtn =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-accent-soft active:scale-95'

export const chipBase =
  'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1 text-sm transition'

export const chipOff =
  'border-line bg-card text-muted hover:border-accent/50 hover:text-ink'

export const chipOn = 'border-accent bg-accent text-accent-ink'

export const tagPill =
  'inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent'
