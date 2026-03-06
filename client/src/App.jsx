import './index.css'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header__icon">🏆</span>
        <h1>Sports Scores</h1>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
