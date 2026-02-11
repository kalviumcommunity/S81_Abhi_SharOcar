import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './PassengerDashboard.css'

export default function PassengerDashboard() {
  const { user, token } = useAuth()
  const nav = useNavigate()

  // Restoration of functional state
  const [query, setQuery] = useState({ from: '', to: '', date: '' })
  const [rides, setRides] = useState([])
  const [bookResult, setBookResult] = useState('')

  const search = async () => {
    try {
      const res = await api.searchRides(query)
      setRides(res)
    } catch (error) {
      console.error("Search failed", error)
    }
  }

  const bookSeat = (rideId) => {
    nav(`/ride/${rideId}`)
  }

  const bookParcel = async (rideId) => {
    try {
      const res = await api.book(token, { rideId, type: 'parcel', parcelDetails: 'Small package', paymentMethod: 'Card' })
      setBookResult(`Parcel request sent (pending approval) • ${res._id}`)
    } catch (error) {
      setBookResult("Parcel booking failed")
    }
  }

  // Initial search on mount
  useEffect(() => { search() }, [])

  return (
    <div className="pd-container">
      <div className="pd-overlay" />

      <div className="pd-content">
        {/* Header */}
        <header className="pd-header">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pd-title"
          >
            Welcome back, {user?.name || 'User'}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pd-subtitle"
          >
            Safe, verified, and reliable ride-sharing and parcel delivery platform.
          </motion.p>
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="pd-search-form">
            <input
              className="pd-input"
              placeholder="From"
              value={query.from}
              onChange={e => setQuery({ ...query, from: e.target.value })}
            />
            <input
              className="pd-input"
              placeholder="To"
              value={query.to}
              onChange={e => setQuery({ ...query, to: e.target.value })}
            />
            <input
              className="pd-input"
              type="date"
              value={query.date}
              onChange={e => setQuery({ ...query, date: e.target.value })}
            />
            <button className="pd-search-btn" onClick={search}>Search</button>
          </div>

          {bookResult && <div className="pd-success">{bookResult}</div>}

          <h2 className="pd-section-title">Available Rides</h2>
          <div className="pd-rides-list">
            {rides.length === 0 && <div className="pd-empty">No rides found. Try different search criteria.</div>}
            {rides.map((r, i) => (
              <motion.div
                key={r._id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="pd-ride-card"
              >
                {/* Avatar placeholder if no driver info, or use default */}
                <div className="pd-driver-avatar" style={{ background: '#ddd' }}></div>

                <div className="pd-ride-info">
                  <div className="pd-route">{r.from} ↭ {r.to}</div>
                  <div className="pd-meta">
                    <span>{new Date(r.date).toLocaleString()}</span>
                    <span>•</span>
                    <span>{r.seats} Seats</span>
                  </div>
                </div>

                <div className="pd-right">
                  <div className="pd-seats">{r.seats} Seats left</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="pd-view-btn" onClick={() => bookSeat(r._id)}>Book Seat</button>
                    {r.parcelAllowed && (
                      <button className="pd-view-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => bookParcel(r._id)}>
                        Parcel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}

