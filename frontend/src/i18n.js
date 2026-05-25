import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import kn from './locales/kn.json'
import ta from './locales/ta.json'

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  ta: { translation: ta }
}

const SUPPORTED_LANGS = new Set(['en', 'hi', 'kn', 'ta'])

const getInitialLang = () => {
  const stored = localStorage.getItem('lang')
  if (stored && SUPPORTED_LANGS.has(stored)) return stored

  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
  const base = nav.split('-')[0]
  return SUPPORTED_LANGS.has(base) ? base : 'en'
}

// In i18next v26 init() is async — we export the promise so main.jsx can
// await it before mounting React. This prevents a flash of raw translation keys.
export const i18nInitPromise = i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
