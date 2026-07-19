import { Link } from 'react-router-dom'

function Header({ name, role }) {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">Hello, I am</p>
        <h1>{name}</h1>
        <h2>{role}</h2>
        <p>I create clean, simple, and responsive web experiences. This portfolio highlights my skills, projects, and learning journey.</p>
        <div className="hero-actions">
          <Link className="btn primary" to="/projects">View Projects</Link>
          <Link className="btn secondary" to="/contact">Contact Me</Link>
        </div>
      </div>
      <div className="hero-image" aria-label={`${name} profile placeholder`}>
        <img src="/assets/princy-profile.jpeg" alt={`${name} profile`} />
      </div>
    </section>
  )
}

export default Header
