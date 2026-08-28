import { useEffect } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import { THEMES, applyTheme } from './themes'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ThemeContext } from './theme-context'

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'wire')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={theme}>
      <div className="app">
        <header className="app-header">
          <div className="app-header__brand">
            <span className="app-header__icon" aria-hidden="true">SS</span>
            <div className="app-header__copy">
              <span className="app-header__eyebrow">Live dashboard</span>
              <h1>Sports Scores</h1>
            </div>
          </div>
          <div className="app-header__meta" aria-label="App highlights">
            <span className="app-header__pill app-header__pill--live">Live</span>
            <select
              className="app-header__theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Select theme"
            >
              {Object.entries(THEMES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </header>
        <main className="app-main">
          <Dashboard />
        </main>
      </div>
    </ThemeContext.Provider>
  )
}

export default App
