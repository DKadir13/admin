import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'admin_panel_theme'

export const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    const value = theme === 'light' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch (_) {}
  }, [theme])

  const setTheme = (value) => setThemeState(value === 'light' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
