import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Explore from './pages/Explore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PassengerDashboard from './pages/PassengerDashboard'
import DriverDashboard from './pages/DriverDashboard'
import RideBooking from './pages/RideBooking'
import ParcelBooking from './pages/ParcelBooking'
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
        <div className="rc-nav-pill">
          {!user && (
            <>
              <Link to="/login">Post a Ride</Link>
              <a href="#" onClick={(e) => e.preventDefault()}>Support</a>
              <Link to="/login">My Rides</Link>
              <Link to="/login">Sign in</Link>
            </>
          )}
          {user?.role === 'driver' && <Link to="/driver">My Rides</Link>}
          {user?.role === 'passenger' && <Link to="/passenger">Dashboard</Link>}
        </div>
      </div>

      <div className="rc-nav-right">
        {user && <button className="rc-nav-btn" onClick={logout}>Logout</button>}
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
        </Routes>
      </div>
    </AuthProvider>
  )
}
