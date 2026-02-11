import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const { login } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.login({ email, password })
      login(res.token, res.user)
      nav(res.user.role === 'driver' ? '/driver' : '/passenger')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="rc-auth rc-hero">
      <div className="rc-hero-overlay" />
      <div className="rc-auth-card">
        <h2>Welcome back</h2>
        <form onSubmit={onSubmit}>
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="rc-error">{error}</div>}
          <motion.button whileTap={{ scale: 0.98 }} className="rc-btn" type="submit">Sign in</motion.button>
        </form>
        <p className="rc-note">No account? <Link to="/signup">Create one</Link></p>
      </div>
    </div>
  )
}
