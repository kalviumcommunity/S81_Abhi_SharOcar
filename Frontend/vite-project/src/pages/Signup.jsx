import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './pages.css'

export default function Signup() {
  const [role, setRole] = useState('passenger')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [aadhaar, setAadhaar] = useState(null)
  const [license, setLicense] = useState(null)
  const [error, setError] = useState('')
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
      if (role === 'driver') {
        if (aadhaar) fd.append('aadhaar', aadhaar)
        if (license) fd.append('license', license)
      }
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

  return (
    <div className="rc-auth rc-hero">
      <div className="rc-hero-overlay" />
      <div className="rc-auth-card">
        <h2>Create your account</h2>
        <div className="rc-role">
          <button className={role==='passenger'?'active':''} onClick={()=>setRole('passenger')}>Passenger</button>
          <button className={role==='driver'?'active':''} onClick={()=>setRole('driver')}>Driver</button>
        </div>
        <form onSubmit={onSubmit}>
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {role==='driver' && (
            <div className="rc-upload-grid">
              <label className="rc-upload">Aadhaar (image/pdf)
                <input type="file" accept="image/*,application/pdf" onChange={e=>setAadhaar(e.target.files?.[0]||null)} />
              </label>
              <label className="rc-upload">Driving License (image/pdf)
                <input type="file" accept="image/*,application/pdf" onChange={e=>setLicense(e.target.files?.[0]||null)} />
              </label>
            </div>
          )}
          {error && <div className="rc-error">{error}</div>}
          <motion.button whileTap={{ scale: 0.98 }} className="rc-btn" type="submit">Create account</motion.button>
        </form>
        <p className="rc-note">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
