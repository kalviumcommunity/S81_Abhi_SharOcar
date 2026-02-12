import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function Explore() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [date2, setDate2] = useState('')
  const [seats, setSeats] = useState(1)

  const [rides, setRides] = useState([])
  const [searched, setSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const onSearch = async (e) => {
    e.preventDefault()
    if (!user) {
      nav('/login')
      return
    }

    setError('')
    setIsSearching(true)
    setSearched(true)
    try {
      const today = new Date()
      const toYmd = (d) => {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      }
      const effectiveDate =
        date2 || (date === 'today' ? toYmd(today) : date === 'tomorrow' ? toYmd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)) : '')

      const res = await api.searchRides({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(effectiveDate ? { date: effectiveDate } : {})
      })

      const filtered = Array.isArray(res)
        ? res.filter((r) => (typeof r?.seats === 'number' ? r.seats >= seats : true))
        : []
      setRides(filtered)
    } catch (e) {
      setError(e.message)
      setRides([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="rc-hero">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner">
        <h1 className="rc-title">Share Your Ride & Earn,<br />Book a Ride & Save</h1>
        <p className="rc-sub">Safe, verified, and reliable ride-sharing and parcel delivery platform.</p>

        <form className="rc-search-panel" onSubmit={onSearch}>
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
              disabled={isSearching}
            >
              {isSearching ? 'Searching…' : 'Search'}
            </motion.button>
          </div>
        </form>

        {error && <div className="rc-error" style={{ marginTop: 14 }}>{error}</div>}

        {user && searched && !error && (
          <div style={{ marginTop: 18 }}>
            {rides.length === 0 ? (
              <div className="rc-note">No rides found.</div>
            ) : (
              <div className="rc-list">
                {rides.map((r) => (
                  <div key={r._id} className="rc-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>
                        {r.from} → {r.to}
                      </div>
                      <div style={{ fontWeight: 800 }}>
                        ₹{r.price}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, opacity: 0.9 }}>
                      {r.date ? new Date(r.date).toLocaleString() : ''}
                      {typeof r.seats === 'number' ? ` • Seats: ${r.seats}` : ''}
                      {r.driver?.name ? ` • Driver: ${r.driver.name}` : ''}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="rc-btn" onClick={() => nav(`/ride/${r._id}`)}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rc-safety">🔒 Secure payments via UPI, Cards, and Cash.</div>
      </div>
    </div>
  )
}
