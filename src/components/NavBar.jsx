import { NavLink } from 'react-router-dom'

function NavBar({ isDarkMode, onThemeToggle }) {
  return <header className="site-header"><nav className="navbar" aria-label="Main navigation"><NavLink className="logo" to="/">Portfolio</NavLink><ul className="nav-links"><li><NavLink to="/" end>Home</NavLink></li><li><NavLink to="/projects">Projects</NavLink></li><li><NavLink to="/contact">Contact</NavLink></li></ul><button className="theme-toggle" type="button" onClick={onThemeToggle} aria-pressed={isDarkMode}>{isDarkMode ? 'Light mode' : 'Dark mode'}</button></nav></header>
}

export default NavBar
