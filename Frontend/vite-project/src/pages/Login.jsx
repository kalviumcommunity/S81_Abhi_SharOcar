import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { auth, googleProvider } from '../lib/firebase'
import './pages.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

  const onGoogle = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const res = await api.googleAuth({ idToken })
      login(res.token, res.user)
      nav(res.user.role === 'driver' ? '/driver' : '/passenger')
    } catch (e) {
      setError(e.message || 'Google sign-in failed')
    } finally {
      setIsGoogleLoading(false)
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

        <div className="rc-auth-divider"><span>or</span></div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="rc-btn ghost"
          type="button"
          onClick={onGoogle}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
        </motion.button>

        <p className="rc-note">No account? <Link to="/signup">Create one</Link></p>
      </div>
    </div>
  )
}
