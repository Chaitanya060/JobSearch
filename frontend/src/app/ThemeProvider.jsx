import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const KEY = 'jobpilot-theme'
const ThemeContext = createContext(null)

function readStored() {
  try {
    return localStorage.getItem(KEY) || 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark())
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored)

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    // Follow the OS while on "System".
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* private mode — ignore */
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
