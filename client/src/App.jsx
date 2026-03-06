import './index.css'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__icon" aria-hidden="true">🏆</span>
          <div className="app-header__copy">
            <span className="app-header__eyebrow">Live dashboard</span>
            <h1>Sports Scores</h1>
          </div>
        </div>
        <div className="app-header__meta" aria-label="App highlights">
          <span className="app-header__pill">NBA + MLB</span>
          <span className="app-header__pill app-header__pill--muted">System theme</span>
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
