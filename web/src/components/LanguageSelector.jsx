import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',    flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',    flag: '🇮🇳' },
]

export default function LanguageSelector({ floating = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const select = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('i18nextLng', code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-subtitle hover:text-white transition-all
          ${floating ? 'bg-card border border-gray-border' : 'hover:bg-card w-full'}`}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{current.flag} {current.label}</span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 bg-card border border-gray-border rounded-xl shadow-2xl overflow-hidden
          ${floating ? 'right-0 top-10 w-40' : 'bottom-full mb-2 left-0 w-full'}`}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors
                ${i18n.language === lang.code
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-subtitle hover:text-white hover:bg-card-hover'}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
