import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { pt } from './locales/pt'

export const LANG_KEY = 'gitchen:lang'

function initialLanguage(): 'en' | 'pt' {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'en' || saved === 'pt') return saved
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pt: { translation: pt } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  localStorage.setItem(LANG_KEY, lng)
})

export function dateLocale(): string {
  return i18n.language === 'pt' ? 'pt-PT' : 'en-GB'
}

export default i18n
