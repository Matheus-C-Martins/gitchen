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
      aria-label="Pagination"
      className="mt-10 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        className={btn}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">Previous</span>
      </button>
      <span className="font-serif text-muted">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
