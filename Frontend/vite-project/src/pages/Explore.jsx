import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './pages.css'

export default function Explore() {
  const nav = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [date2, setDate2] = useState('')
  const [seats, setSeats] = useState(1)

  const onSearch = (e) => {
    e.preventDefault()
    nav('/login') // redirect to login when unauthenticated per spec
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
            >
              Search
            </motion.button>
          </div>
        </form>

        <div className="rc-safety">🔒 Secure payments via UPI, Cards, and Cash.</div>
      </div>
    </div>
  )
}
