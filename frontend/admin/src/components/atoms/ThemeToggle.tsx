import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const themeKey = 'enigma-theme'
type Theme = 'light' | 'dark'

function preferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(themeKey)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Mantém o tema disponível sem armazenamento. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function initializeTheme() {
  document.documentElement.dataset.theme = preferredTheme()
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    const syncTheme = () => {
      const next = preferredTheme()
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    window.addEventListener('storage', syncTheme)
    media.addEventListener('change', syncTheme)
    return () => {
      window.removeEventListener('storage', syncTheme)
      media.removeEventListener('change', syncTheme)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    setTheme(next)
    try { localStorage.setItem(themeKey, next) } catch { /* Aplica o tema apenas nesta sessão. */ }
  }

  return <button className="theme-toggle" type="button" aria-label="Modo escuro" aria-pressed={theme === 'dark'} title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={toggleTheme}>
    {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    <span className="theme-toggle-label">{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
  </button>
}
