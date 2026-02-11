import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function DriverDashboard() {
  const { token } = useAuth()
  const [form, setForm] = useState({ from: '', to: '', date: '', seats: 3, price: 200, parcelAllowed: true })
  const [rides, setRides] = useState([])
  const [msg, setMsg] = useState('')

  const loadRides = async () => {
    const res = await api.myRides(token)
    setRides(res)
  }

  const postRide = async (e) => {
    e.preventDefault()
    const r = await api.createRide(token, form)
    setMsg(`Ride posted • ${r._id}`)
    setForm({ ...form, from: '', to: '' })
    loadRides()
  }

  useEffect(() => { loadRides() }, [])

  return (
    <div className="rc-page">
      <h2>Post a Ride</h2>
      <form className="rc-grid-3" onSubmit={postRide}>
        <input placeholder="From" value={form.from} onChange={e=>setForm({ ...form, from: e.target.value })} />
        <input placeholder="To" value={form.to} onChange={e=>setForm({ ...form, to: e.target.value })} />
        <input type="datetime-local" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} />
        <input type="number" min="1" placeholder="Seats" value={form.seats} onChange={e=>setForm({ ...form, seats: Number(e.target.value) })} />
        <input type="number" min="0" placeholder="Price" value={form.price} onChange={e=>setForm({ ...form, price: Number(e.target.value) })} />
        <label className="rc-checkbox"><input type="checkbox" checked={form.parcelAllowed} onChange={e=>setForm({ ...form, parcelAllowed: e.target.checked })} /> Allow Parcel</label>
        <motion.button whileTap={{ scale: 0.98 }} className="rc-btn" type="submit">Publish</motion.button>
      </form>

      {msg && <div className="rc-success">{msg}</div>}

      <h3>Your Rides</h3>
      <div className="rc-list">
        {rides.map(r => (
          <div key={r._id} className="rc-card">
            <div><b>{r.from}</b> → <b>{r.to}</b></div>
            <div>{new Date(r.date).toLocaleString()} • Seats left: {r.seats} • ₹{r.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
