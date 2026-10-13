import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { btn } from '../lib/ui'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label={t('pagination.label')}
      className="mt-10 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        className={btn}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label={t('pagination.previousPage')}
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">{t('pagination.previous')}</span>
      </button>
      <span className="font-serif text-muted">
        {t('pagination.pageOf', { page: page + 1, total: totalPages })}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t('pagination.nextPage')}
      >
        <span className="hidden sm:inline">{t('pagination.next')}</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
