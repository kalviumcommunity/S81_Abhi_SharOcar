import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { auth, googleProvider } from '../lib/firebase'
import './pages.css'

export default function Signup() {
  const [role, setRole] = useState('passenger')
  const [name, setName] = useState('')
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
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('role', role)
      const res = await api.signup(fd)
      if (res.token) {
        login(res.token, res.user)
        nav(res.user.role === 'driver' ? '/driver' : '/passenger')
      } else {
        setError(res.message || 'Signup failed')
      }
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
      const res = await api.googleAuth({ idToken, role })
      login(res.token, res.user)
      nav(res.user.role === 'driver' ? '/driver' : '/passenger')
    } catch (e) {
      setError(e.message || 'Google sign-up failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="rc-auth rc-hero">
      <div className="rc-hero-overlay" />
      <div className="rc-auth-card">
        <h2>Create your account</h2>
        <div className="rc-role">
          <button className={role==='passenger'?'active':''} onClick={()=>setRole('passenger')}>Passenger</button>
          <button className={role==='driver'?'active':''} onClick={()=>setRole('driver')}>Driver</button>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="rc-btn ghost"
          type="button"
          onClick={onGoogle}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? 'Continuing…' : 'Continue with Google'}
        </motion.button>

        <div className="rc-auth-divider"><span>or</span></div>

        <form onSubmit={onSubmit}>
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="rc-error">{error}</div>}
          <motion.button whileTap={{ scale: 0.98 }} className="rc-btn" type="submit">Create account</motion.button>
        </form>
        <p className="rc-note">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
