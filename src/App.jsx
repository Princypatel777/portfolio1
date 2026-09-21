import { lazy, Suspense, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Footer from './components/Footer'
import Home from './components/Home'
import NavBar from './components/NavBar'
import NotFound from './components/NotFound'
import TaskPage from './pages/TaskPage'
import AuthPage from './pages/AuthPage'

const Projects = lazy(() => import('./components/Projects'))
const Contact = lazy(() => import('./components/Contact'))

function RouteLoadingFallback() {
  return (
    <section className="route-loading" aria-busy="true" aria-live="polite">
      <div>
        <span className="route-loading__spinner" aria-hidden="true" />
        <p>Loading page...</p>
      </div>
    </section>
  )
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div className={`portfolio-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <NavBar isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode((current) => !current)} />
      <main>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<TaskPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/contact" element={<Contact email="princypatel7299@gmail.com" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer name="Princy Patel" email="princypatel7299@gmail.com" />
    </div>
  )
}

export default App
