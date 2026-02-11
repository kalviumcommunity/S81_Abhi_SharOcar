import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './pages.css'

function statusLabel(status) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'rejected') return 'Rejected'
  if (status === 'cancelled') return 'Cancelled'
  return 'Pending approval'
}

export default function MyRides() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState([])
  const [cancelingId, setCancelingId] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.myBookings(token)
        if (!alive) return
        setBookings(Array.isArray(res) ? res : [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load bookings')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [token])

  const cancelBooking = async (bookingId) => {
    setError('')
    setCancelingId(bookingId)
    try {
      const res = await api.cancelBooking(token, bookingId)
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: res.status } : b)))
    } catch (e) {
      setError(e.message || 'Cancel failed')
    } finally {
      setCancelingId('')
    }
  }

  return (
    <div className="rc-hero rc-my">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner rc-my-inner">
        <h2 className="rc-my-title">My Rides</h2>

        {loading && <div className="rc-note">Loading…</div>}
        {error && <div className="rc-error">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="rc-note">No bookings yet.</div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="rc-my-list">
            {bookings.map((b) => {
              const ride = b.ride
              const route = ride ? `${ride.from} → ${ride.to}` : 'Ride'
              const dateText = ride?.date ? new Date(ride.date).toLocaleString() : ''

              const passengerNames = Array.isArray(b.passengers)
                ? b.passengers
                    .map((p) => p?.name)
                    .filter(Boolean)
                    .join(', ')
                : ''

              return (
                <div key={b._id} className="rc-my-item">
                  <div className="rc-my-top">
                    <div>
                      <div className="rc-my-route">{route}</div>
                      <div className="rc-note">
                        {dateText}
                        {dateText ? ' • ' : ''}
                        Status: {statusLabel(b.status)}
                      </div>
                    </div>

                    <div className="rc-my-actions">
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button
                          type="button"
                          className="rc-btn ghost small"
                          onClick={() => cancelBooking(b._id)}
                          disabled={!token || cancelingId === b._id}
                        >
                          {cancelingId === b._id ? 'Canceling…' : 'Cancel'}
                        </button>
                      )}

                      <span className={`rc-my-pill rc-my-pill--${b.status || 'pending'}`}>
                        {statusLabel(b.status)}
                      </span>
                    </div>
                  </div>

                  <div className="rc-my-meta">
                    <div className="rc-note">Type: {b.type}</div>
                    {b.type === 'seat' && (
                      <div className="rc-note">Seats: {b.seatsCount || b.passengers?.length || 1}</div>
                    )}
                    <div className="rc-note">Payment: {b.paymentMethod}</div>
                  </div>

                  {b.type === 'seat' && passengerNames && (
                    <div className="rc-my-sub">
                      <div className="rc-note">Passengers: {passengerNames}</div>
                    </div>
                  )}

                  {b.type === 'parcel' && b.parcelDetails && (
                    <div className="rc-my-sub">
                      <div className="rc-note">Parcel: {b.parcelDetails}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
