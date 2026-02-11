import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import logo from '../assets/Logo.png'
import './pages.css'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Profile() {
  const nav = useNavigate()
  const { user, logout } = useAuth()

  const onLogout = () => {
    logout()
    nav('/')
  }

  return (
    <div className="rc-profile">
      <div className="rc-dash-overlay" />

      <header className="rc-dash-top">
        <div className="rc-dash-brand">
          <Link to="/" className="rc-brand" aria-label="ShareOcar">
            <img className="rc-brand-mark" src={logo} alt="" />
            <div className="rc-brand-text">
              Share<span>Ocar</span>
            </div>
          </Link>
        </div>
        <div aria-hidden />
        <div className="rc-dash-user">
          <button type="button" className="rc-nav-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="rc-profile-main">
        <div className="rc-profile-card">
          <div className="rc-profile-photo" aria-label="Profile photo">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4.2 21c1.6-4.3 5-6.4 7.8-6.4s6.2 2.1 7.8 6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <div className="rc-profile-initials">{initials(user?.name || 'U')}</div>
          </div>

          <h1 className="rc-profile-title">{user?.name || 'User'}</h1>

          <div className="rc-profile-details">
            <div className="rc-profile-row">
              <div className="rc-profile-k">Email</div>
              <div className="rc-profile-v">{user?.email || '—'}</div>
            </div>
            <div className="rc-profile-row">
              <div className="rc-profile-k">Role</div>
              <div className="rc-profile-v">{user?.role || '—'}</div>
            </div>
          </div>

          <Link className="rc-btn ghost" to="/passenger">Back to Dashboard</Link>
        </div>
      </main>
    </div>
  )
}
