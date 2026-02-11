import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function PassengerDashboard() {
  const { token } = useAuth()
  const [query, setQuery] = useState({ from: '', to: '', date: '' })
  const [rides, setRides] = useState([])
  const [bookResult, setBookResult] = useState('')

  const search = async () => {
    const res = await api.searchRides(query)
    setRides(res)
  }

  const bookSeat = async (rideId) => {
    const res = await api.book(token, { rideId, type: 'seat', seatsCount: 1, paymentMethod: 'UPI' })
    setBookResult(`Booked seat • ${res._id}`)
  }

  const bookParcel = async (rideId) => {
    const res = await api.book(token, { rideId, type: 'parcel', parcelDetails: 'Small package', paymentMethod: 'Card' })
    setBookResult(`Parcel requested • ${res._id}`)
  }

  useEffect(() => { search() }, [])

  return (
    <div className="rc-page">
      <h2>Find a Ride</h2>
      <div className="rc-grid-3 rc-search-inline">
        <input placeholder="From" value={query.from} onChange={e=>setQuery({ ...query, from: e.target.value })} />
        <input placeholder="To" value={query.to} onChange={e=>setQuery({ ...query, to: e.target.value })} />
        <input type="date" value={query.date} onChange={e=>setQuery({ ...query, date: e.target.value })} />
        <motion.button whileTap={{ scale: 0.98 }} className="rc-btn" onClick={search}>Search</motion.button>
      </div>

      {bookResult && <div className="rc-success">{bookResult}</div>}

      <div className="rc-list">
        {rides.map((r) => (
          <div key={r._id} className="rc-card">
            <div><b>{r.from}</b> → <b>{r.to}</b></div>
            <div>{new Date(r.date).toLocaleString()} • Seats left: {r.seats}</div>
            <div className="rc-row">
              <motion.button whileTap={{ scale: 0.98 }} className="rc-btn small" onClick={() => bookSeat(r._id)}>Book Seat</motion.button>
              {r.parcelAllowed && <button className="rc-btn ghost small" onClick={() => bookParcel(r._id)}>Send Parcel</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
