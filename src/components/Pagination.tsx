import { ChevronLeft, ChevronRight } from 'lucide-react'
import { btn } from '../lib/ui'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label="Paginação"
      className="mt-10 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        className={btn}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">Anterior</span>
      </button>
      <span className="font-serif text-muted">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="Página seguinte"
      >
        <span className="hidden sm:inline">Seguinte</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
