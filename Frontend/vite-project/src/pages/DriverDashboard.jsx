import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function DriverDashboard() {
  const { token } = useAuth()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [date2, setDate2] = useState('')
  const [seats, setSeats] = useState(1)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState([])
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b?.status === 'pending'),
    [bookings]
  )

  const loadBookings = async () => {
    if (!token) return
    try {
      const res = await api.myBookings(token)
      setBookings(Array.isArray(res) ? res : [])
    } catch (e) {
      // Keep silent here; approvals will show specific errors
      setBookings([])
    }
  }

  useEffect(() => {
    loadBookings()
  }, [token])

  const postRide = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')

    const rideDate = date2 || ''
    if (!from.trim() || !to.trim() || !rideDate) {
      setError('Please fill From, To, and Date')
      return
    }

    try {
      const payload = {
        from,
        to,
        date: rideDate,
        seats,
        price: 200,
        parcelAllowed: true,
      }
      const r = await api.createRide(token, payload)
      setMsg(`Ride posted • ${r._id}`)
      setFrom('')
      setTo('')
      setDate('')
      setDate2('')
      setSeats(1)
      loadBookings()
    } catch (e2) {
      setError(e2.message || 'Failed to post ride')
    }
  }

  const approve = async (bookingId) => {
    setActionMsg('')
    setActionErr('')
    try {
      await api.approveBooking(token, bookingId)
      setActionMsg('Booking approved')
      loadBookings()
    } catch (e) {
      setActionErr(e.message || 'Approve failed')
    }
  }

  const reject = async (bookingId) => {
    setActionMsg('')
    setActionErr('')
    try {
      await api.rejectBooking(token, bookingId)
      setActionMsg('Booking rejected')
      loadBookings()
    } catch (e) {
      setActionErr(e.message || 'Reject failed')
    }
  }

  return (
    <div className="rc-hero">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner">
        <h1 className="rc-title">Share Your Ride & Earn</h1>
        <p className="rc-sub">Post your ride and earn on the way.</p>

        <form className="rc-search-panel" onSubmit={postRide}>
          <div className="rc-search-row rc-search-row-1">
            <input
              placeholder="Enter starting point"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              placeholder="Enter destination"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <select value={date} onChange={(e) => setDate(e.target.value)}>
              <option value="">Date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>

          <div className="rc-search-row rc-search-row-2">
            <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} />
            <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} Seat{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              className="rc-btn rc-search-btn"
              type="submit"
            >
              Post Ride
            </motion.button>
          </div>
        </form>

        {error && <div className="rc-error">{error}</div>}
        {msg && <div className="rc-success">{msg}</div>}

        <div className="rc-driver-requests">
          <h2 className="rc-section-h">Booking requests</h2>
          {actionErr && <div className="rc-error">{actionErr}</div>}
          {actionMsg && <div className="rc-success">{actionMsg}</div>}

          {pendingBookings.length === 0 ? (
            <div className="rc-note">No pending requests.</div>
          ) : (
            <div className="rc-list">
              {pendingBookings.map((b) => (
                <div key={b._id} className="rc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {b?.ride?.from} → {b?.ride?.to}
                      </div>
                      <div className="rc-note">
                        Passenger: {b?.user?.name || '—'} • {b?.type === 'seat' ? `${b?.seatsCount || 1} seat(s)` : 'parcel'}
                        {b?.type === 'seat' && Array.isArray(b?.passengers) && b.passengers.length > 0 && (
                          <span>
                            {' '}• {b.passengers.map((p) => p?.name).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="rc-btn small" onClick={() => approve(b._id)}>
                        Approve
                      </button>
                      <button type="button" className="rc-btn small ghost" onClick={() => reject(b._id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
