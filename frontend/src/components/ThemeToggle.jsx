import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      title={isLight ? 'Koyu tema' : 'Açık tema'}
      aria-label={isLight ? 'Koyu temaya geç' : 'Açık temaya geç'}
    >
      <span className="theme-toggle-label">{isLight ? 'Koyu' : 'Açık'}</span>
      <span className="theme-toggle-icon" aria-hidden>
        {isLight ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
