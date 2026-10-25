import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { login, register } from '../api'
import './AuthPage.css'

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      if (isLogin) {
        await login({ email, password })
        navigate('/')
      } else {
        await register({ email, password })
        setMessage('Account created. You can now log in.')
        setPassword('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-heading">
      <p className="auth-eyebrow">My Portfolio</p>
      <h1 id="auth-heading">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
      <p>{isLogin ? 'Log in to continue to the portfolio.' : 'Create an account for this portfolio.'}</p>

      {error && <p className="auth-message error" role="alert">{error}</p>}
      {message && <p className="auth-message success" role="status">{message}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required autoComplete={isLogin ? 'current-password' : 'new-password'} />

        <button type="submit" disabled={submitting}>{submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Register'}</button>
      </form>

      <p className="auth-switch">
        {isLogin ? 'New here? ' : 'Already have an account? '}
        <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</Link>
      </p>
    </section>
  </main>
}
