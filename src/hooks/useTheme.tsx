import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolved: 'dark' | 'light'
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolved: 'dark',
  setTheme: () => {},
})

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    window.api.getSetting('theme').then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setThemeState(v)
      }
    })
    window.api.onThemeChanged((t: string) => {
      if (t === 'light' || t === 'dark' || t === 'system') {
        setThemeState(t)
      }
    })
  }, [])

  useEffect(() => {
    if (theme === 'system') {
      setResolved(getSystemTheme())
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => setResolved(getSystemTheme())
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      setResolved(theme)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    window.api.setTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
