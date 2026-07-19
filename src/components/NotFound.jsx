import { Link } from 'react-router-dom'

function NotFound() {
  return <section className="section not-found"><p className="eyebrow">404 Error</p><h1>Page not found</h1><p>The page you requested does not exist.</p><Link className="btn primary" to="/">Return home</Link></section>
}

export default NotFound
