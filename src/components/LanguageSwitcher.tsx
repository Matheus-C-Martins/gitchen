import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { btn } from '../lib/ui'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const next = i18n.language === 'pt' ? 'en' : 'pt'
  const label = t('language.switchTo', { language: t(`language.${next}`) })
  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={label}
      title={label}
      className={btn}
    >
      <Languages className="size-4" aria-hidden />
      {next.toUpperCase()}
    </button>
  )
}
