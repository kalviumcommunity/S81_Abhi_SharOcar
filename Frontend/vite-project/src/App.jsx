import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import Explore from './pages/Explore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PassengerDashboard from './pages/PassengerDashboard'
import DriverDashboard from './pages/DriverDashboard'
import RideBooking from './pages/RideBooking'
import ParcelBooking from './pages/ParcelBooking'
import Profile from './pages/Profile'
import MyRides from './pages/MyRides'
import { AuthProvider, useAuth } from './auth/AuthContext'
import logo from './assets/Logo.png'
import './App.css'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function NavBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const myRidesPath = user?.role === 'driver' ? '/driver' : '/my-rides'

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('')

  const avatarUrl = (() => {
    if (!user?.avatarPath) return ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    return `${base}${user.avatarPath}`
  })()

  useEffect(() => {
    if (!isMenuOpen) return
    const onMouseDown = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setIsMenuOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [isMenuOpen])

  const onLogout = () => {
    logout()
    setIsMenuOpen(false)
    nav('/')
  }

  return (
    <div className="rc-nav">
      <div className="rc-nav-left">
        <Link to="/" className="rc-logo" aria-label="ShareOcar">
          <img className="rc-logo-mark" src={logo} alt="" />
          <div className="rc-logo-text">
            Share<span>Ocar</span>
          </div>
        </Link>
      </div>

      <div className="rc-nav-center">
        {!user && (
          <div className="rc-nav-pill">
            <Link to="/login">Post a Ride</Link>
            <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
            <Link to="/login">My Rides</Link>
            <Link to="/login">Sign in</Link>
          </div>
        )}
      </div>

      <div className="rc-nav-right">
        {user && (
          <div className="rc-nav-profile" ref={menuRef}>
            {user?.role === 'driver' && (
              <Link to="/driver" className="rc-nav-dashboard">Dashboard</Link>
            )}
            <button type="button" className="rc-nav-icon-btn" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 22a2.6 2.6 0 0 0 2.6-2.6H9.4A2.6 2.6 0 0 0 12 22Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M18 9.7a6 6 0 0 0-12 0c0 7-3 7.6-3 7.6h18s-3-.6-3-7.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              type="button"
              className="rc-nav-btn rc-nav-profile-btn"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Profile menu"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <span className="rc-nav-avatar" aria-hidden="true">
                {avatarUrl ? (
                  <img className="rc-nav-avatar-img" src={avatarUrl} alt="" />
                ) : (
                  initials(user?.name || 'U')
                )}
              </span>
              <span className="rc-nav-name">{user?.name || 'User'}</span>
            </button>

            {isMenuOpen && (
              <div className="rc-nav-menu" role="menu">
                <Link to="/profile" role="menuitem" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                <Link to={myRidesPath} role="menuitem" onClick={() => setIsMenuOpen(false)}>My Rides</Link>
                <button type="button" role="menuitem" onClick={onLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="rc-app">
        <NavBar />
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/ride/:id" element={<RideBooking />} />
          <Route path="/parcel/:id" element={<ParcelBooking />} />

          <Route
            path="/passenger"
            element={
              <PrivateRoute roles={["passenger"]}>
                <PassengerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver"
            element={
              <PrivateRoute roles={["driver"]}>
                <DriverDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-rides"
            element={
              <PrivateRoute roles={["passenger"]}>
                <MyRides />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}
