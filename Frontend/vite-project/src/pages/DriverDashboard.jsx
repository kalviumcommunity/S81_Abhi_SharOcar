import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import './pages.css'

export default function DriverDashboard() {
  const { token } = useAuth()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [dateValue, setDateValue] = useState('')
  const [rideType, setRideType] = useState('seat')
  const [seats, setSeats] = useState(1)
  const [price, setPrice] = useState(200)
  const [parcelWeightKg, setParcelWeightKg] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [dropTime, setDropTime] = useState('')

  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const [bookings, setBookings] = useState([])
  const [bookingsErr, setBookingsErr] = useState('')

  const [upcomingRides, setUpcomingRides] = useState([])
  const [upcomingErr, setUpcomingErr] = useState('')

  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')

  const [chatOpenId, setChatOpenId] = useState('')
  const [chatLoadingId, setChatLoadingId] = useState('')
  const [chatErr, setChatErr] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatSending, setChatSending] = useState(false)

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b?.status === 'pending'),
    [bookings]
  )

  const toYmd = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const startOfToday = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const onPresetDateChange = (value) => {
    setDatePreset(value)
    if (value === 'today') {
      setDateValue(toYmd(new Date()))
    } else if (value === 'tomorrow') {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      setDateValue(toYmd(d))
    }
  }

  const loadBookings = async () => {
    if (!token) return
    try {
      setBookingsErr('')
      const res = await api.myBookings(token)
      setBookings(Array.isArray(res) ? res : [])
    } catch (e) {
      setBookings([])
      setBookingsErr(e.message || 'Failed to load booking requests')
    }
  }

  const loadUpcomingRides = async () => {
    if (!token) return
    try {
      setUpcomingErr('')
      const res = await api.myRides(token)
      const all = Array.isArray(res) ? res : []
      const today = startOfToday()
      const upcoming = all.filter((r) => {
        const d = r?.date ? new Date(r.date) : null
        return d && !Number.isNaN(d.getTime()) && d >= today
      })
      setUpcomingRides(upcoming)
    } catch (e) {
      setUpcomingRides([])
      setUpcomingErr(e.message || 'Failed to load upcoming rides')
    }
  }

  useEffect(() => {
    loadBookings()
    loadUpcomingRides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const postRide = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')

    const rideDate = dateValue || ''
    if (!from.trim() || !to.trim() || !rideDate) {
      setError('Please fill From, To, and Date')
      return
    }

    if (price === '' || !Number.isFinite(Number(price)) || Number(price) < 0) {
      setError('Please enter a valid price')
      return
    }

    try {
      const payload = {
        from,
        to,
        date: rideDate,
        rideType,
        seats: rideType === 'parcel' ? 0 : seats,
        price: Number(price),
        pickupTime: pickupTime || undefined,
        dropTime: dropTime || undefined,
        ...(rideType === 'parcel' && parcelWeightKg !== ''
          ? { parcelWeightKg: Number(parcelWeightKg) }
          : {}),
      }
      const r = await api.createRide(token, payload)
      setMsg(`Ride posted • ${r._id}`)

      // update upcoming list if the posted ride is upcoming
      const d = r?.date ? new Date(r.date) : null
      if (d && !Number.isNaN(d.getTime()) && d >= startOfToday()) {
        setUpcomingRides((prev) => {
          const next = Array.isArray(prev) ? prev : []
          if (next.some((x) => x?._id === r?._id)) return next
          return [r, ...next]
        })
      }

      setFrom('')
      setTo('')
      setDatePreset('')
      setDateValue('')
      setRideType('seat')
      setSeats(1)
      setPrice(200)
      setParcelWeightKg('')
      setPickupTime('')
      setDropTime('')

      loadBookings()
      loadUpcomingRides()
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

  const toggleChat = async (bookingId) => {
    setChatErr('')
    if (!bookingId) return
    if (chatOpenId === bookingId) {
      setChatOpenId('')
      setChatMessages([])
      setChatText('')
      return
    }
    setChatOpenId(bookingId)
    setChatMessages([])
    setChatText('')
    setChatLoadingId(bookingId)
    try {
      const res = await api.getBookingMessages(token, bookingId)
      setChatMessages(Array.isArray(res?.messages) ? res.messages : [])
    } catch (e) {
      setChatErr(e.message || 'Failed to load messages')
    } finally {
      setChatLoadingId('')
    }
  }

  const sendChat = async (bookingId) => {
    if (!bookingId) return
    setChatErr('')
    const text = chatText.trim()
    if (!text) return
    setChatSending(true)
    try {
      const created = await api.sendBookingMessage(token, bookingId, text)
      setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), created])
      setChatText('')
    } catch (e) {
      setChatErr(e.message || 'Send failed')
    } finally {
      setChatSending(false)
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
            <select value={datePreset} onChange={(e) => onPresetDateChange(e.target.value)}>
              <option value="">Date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>

          <div className="rc-search-row rc-search-row-2">
            <input
              type="date"
              value={dateValue}
              onChange={(e) => {
                setDateValue(e.target.value)
                if (datePreset) setDatePreset('')
              }}
            />

            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              aria-label="Pickup time"
            />

            <input
              type="time"
              value={dropTime}
              onChange={(e) => setDropTime(e.target.value)}
              aria-label="Drop time"
            />
          </div>

          <div className="rc-search-row rc-search-row-3">
            <select
              value={rideType}
              onChange={(e) => {
                const v = e.target.value
                setRideType(v)
                if (v === 'seat' && Number(seats) < 1) setSeats(1)
                if (v === 'seat') setParcelWeightKg('')
              }}
            >
              <option value="seat">Passengers</option>
              <option value="parcel">Parcel</option>
            </select>

            {rideType === 'seat' ? (
              <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Seat{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Parcel weight (kg)"
                value={parcelWeightKg}
                onChange={(e) => setParcelWeightKg(e.target.value)}
              />
            )}

            <input
              type="number"
              min="0"
              step="1"
              placeholder="Price per seat"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="rc-search-row rc-search-row-4">
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
          <h2 className="rc-section-h">Upcoming rides</h2>

          {upcomingErr && <div className="rc-error">{upcomingErr}</div>}

          {upcomingRides.length === 0 ? (
            <div className="rc-note">No upcoming rides.</div>
          ) : (
            <div className="rc-list">
              {upcomingRides.map((r) => (
                <div key={r._id} className="rc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {r?.from} → {r?.to}
                      </div>
                      <div className="rc-note">
                        {r?.date ? new Date(r.date).toLocaleDateString() : '—'} • {r?.rideType === 'parcel' ? 'Parcel only' : `${r?.seats || 1} seat(s)`} • ₹{r?.price ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rc-driver-requests">
          <h2 className="rc-section-h">Booking requests</h2>
          {bookingsErr && <div className="rc-error">{bookingsErr}</div>}
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
                      <button type="button" className="rc-btn small ghost" onClick={() => toggleChat(b._id)}>
                        {chatOpenId === b._id ? 'Close chat' : 'Messages'}
                      </button>
                      <button type="button" className="rc-btn small" onClick={() => approve(b._id)}>
                        Approve
                      </button>
                      <button type="button" className="rc-btn small ghost" onClick={() => reject(b._id)}>
                        Reject
                      </button>
                    </div>
                  </div>

                  {chatOpenId === b._id && (
                    <div style={{ marginTop: 12 }}>
                      {chatErr && <div className="rc-error">{chatErr}</div>}
                      {chatLoadingId === b._id ? (
                        <div className="rc-note">Loading messages…</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {chatMessages.length === 0 ? (
                            <div className="rc-note">No messages yet.</div>
                          ) : (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {chatMessages.map((m) => (
                                <div key={m._id} className="rc-note">
                                  <span style={{ fontWeight: 800 }}>{m?.sender?.name || 'User'}:</span> {m?.text}
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                            <input
                              value={chatText}
                              onChange={(e) => setChatText(e.target.value)}
                              placeholder="Type a message"
                            />
                            <button
                              type="button"
                              className="rc-btn small"
                              onClick={() => sendChat(b._id)}
                              disabled={chatSending}
                            >
                              {chatSending ? 'Sending…' : 'Send'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
