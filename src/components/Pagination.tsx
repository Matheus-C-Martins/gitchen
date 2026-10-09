interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const btn =
  'rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 transition hover:bg-stone-100 disabled:opacity-40 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label="Paginação"
      className="mt-6 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        className={btn}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        ← Anterior
      </button>
      <span className="text-sm text-stone-500 dark:text-stone-400">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Seguinte →
      </button>
    </nav>
  )
}
