import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Home from './components/Home'
import NavBar from './components/NavBar'
import NotFound from './components/NotFound'
import Projects from './components/Projects'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div className={`portfolio-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <NavBar isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode((current) => !current)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact email="princypatel7299@gmail.com" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer name="Princy Patel" email="princypatel7299@gmail.com" />
    </div>
  )
}

export default App
