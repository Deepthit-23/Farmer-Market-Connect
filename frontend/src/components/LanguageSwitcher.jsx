import React from 'react'
import { useTranslation } from 'react-i18next'

const LANG_OPTIONS = [
  { code: 'en', label: '🇺🇸 EN' },
  { code: 'hi', label: '🇮🇳 हिन्दी' },
  { code: 'kn', label: '🇮🇳 ಕನ್ನಡ' },
  { code: 'ta', label: '🇮🇳 தமிழ்' }
]

export default function LanguageSwitcher({ role }) {
  const { i18n } = useTranslation()

  const current = i18n.resolvedLanguage || i18n.language || 'en'

  const change = async (e) => {
    const lang = e.target.value
    localStorage.setItem('lang', lang)
    await i18n.changeLanguage(lang)

    // Persist user preference to backend if logged in
    try {
      const token = localStorage.getItem('token')
      const userRole = role || localStorage.getItem('role')
      if (token && userRole) {
        const endpoint = userRole === 'farmer' ? '/api/farmer/language' : '/api/buyer/language'
        await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: lang })
        })
      }
    } catch (err) {
      console.warn('Failed to persist language preference', err)
    }
  }

  return (
    <select
      value={current}
      onChange={change}
      aria-label="Language switcher"
      style={{
        background: '#1B2E24',
        border: '1px solid rgba(82,183,136,0.3)',
        borderRadius: '8px',
        color: 'var(--color-forest)',
        fontSize: '0.82rem',
        fontWeight: '600',
        padding: '0.45rem 0.75rem',
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'var(--font-body)'
      }}
    >
      {LANG_OPTIONS.map(o => (
        <option key={o.code} value={o.code}>{o.label}</option>
      ))}
    </select>
  )
}
