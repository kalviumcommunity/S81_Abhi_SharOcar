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
import { api } from './lib/api'
import logo from './assets/Logo.png'
import './App.css'

function PrivateRoute({ children, roles }) {
  const { user, isHydrated } = useAuth()
  if (!isHydrated) return null
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function NavBar() {
  const { user, token, logout } = useAuth()
  const nav = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifErr, setNotifErr] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotifLoading, setIsNotifLoading] = useState(false)
  const menuRef = useRef(null)

  const isAuthed = Boolean(user && token)

  const myRidesPath = '/my-rides'

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('')

  const avatarUrl = (() => {
    if (!user?.avatarPath) return ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5002'
    return `${base}${user.avatarPath}`
  })()

  useEffect(() => {
    if (!isMenuOpen && !isNotifOpen) return
    const onMouseDown = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
        setIsNotifOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [isMenuOpen, isNotifOpen])

  useEffect(() => {
    if (!isAuthed) {
      setIsMenuOpen(false)
      setIsNotifOpen(false)
      setNotifications([])
      setUnreadCount(0)
      setNotifErr('')
    }
  }, [isAuthed])

  const loadNotifications = async () => {
    if (!token) return
    setNotifErr('')
    setIsNotifLoading(true)
    try {
      const res = await api.getNotifications(token)
      setNotifications(Array.isArray(res?.notifications) ? res.notifications : [])
      setUnreadCount(Number(res?.unreadCount) || 0)
    } catch (e) {
      setNotifErr(e.message || 'Failed to load notifications')
    } finally {
      setIsNotifLoading(false)
    }
  }

  const onLogout = () => {
    logout()
    setIsMenuOpen(false)
    setIsNotifOpen(false)
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
        {!isAuthed && (
          <div className="rc-nav-pill">
            <Link to="/login">Post a Ride</Link>
            <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
            <Link to="/login">My Rides</Link>
            <Link to="/login">Sign in</Link>
          </div>
        )}
      </div>

      <div className="rc-nav-right">
        {isAuthed && (
          <div className="rc-nav-profile" ref={menuRef}>
            <button
              type="button"
              className="rc-nav-icon-btn"
              aria-label="Notifications"
              onClick={async () => {
                const next = !isNotifOpen
                setIsNotifOpen(next)
                if (next) {
                  setIsMenuOpen(false)
                  await loadNotifications()
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 22a2.6 2.6 0 0 0 2.6-2.6H9.4A2.6 2.6 0 0 0 12 22Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M18 9.7a6 6 0 0 0-12 0c0 7-3 7.6-3 7.6h18s-3-.6-3-7.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>

            {unreadCount > 0 && (
              <div className="rc-note" style={{ marginRight: 6 }} aria-label="Unread notifications">
                {unreadCount}
              </div>
            )}

            {isNotifOpen && (
              <div className="rc-nav-menu" role="menu" style={{ right: 84, minWidth: 320 }}>
                <div className="rc-note" style={{ padding: '10px 12px' }}>Notifications</div>
                {notifErr && <div className="rc-error" style={{ margin: 10 }}>{notifErr}</div>}
                {isNotifLoading ? (
                  <div className="rc-note" style={{ padding: '10px 12px' }}>Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="rc-note" style={{ padding: '10px 12px' }}>No notifications</div>
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          await api.markAllNotificationsRead(token)
                          await loadNotifications()
                        }}
                      >
                        Mark all read
                      </button>
                    )}

                    {notifications.map((n) => {
                      const isUnread = !n?.readAt
                      return (
                        <button
                          key={n._id}
                          type="button"
                          role="menuitem"
                          onClick={async () => {
                            if (isUnread) {
                              await api.markNotificationRead(token, n._id)
                              await loadNotifications()
                            }
                            setIsNotifOpen(false)
                            nav('/my-rides')
                          }}
                          style={{ fontWeight: isUnread ? 800 : 600 }}
                        >
                          <div style={{ display: 'grid', gap: 2, textAlign: 'left' }}>
                            <div>{n?.title || 'Notification'}</div>
                            <div className="rc-note" style={{ margin: 0 }}>{n?.message || ''}</div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )}

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
                <Link
                  to={user?.role === 'driver' ? '/driver' : '/passenger'}
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
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
              <PrivateRoute>
                <MyRides />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}
