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
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState([])
  const [cancelingId, setCancelingId] = useState('')
  const [rides, setRides] = useState([])

  const [chatOpenId, setChatOpenId] = useState('')
  const [chatLoadingId, setChatLoadingId] = useState('')
  const [chatErr, setChatErr] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatSending, setChatSending] = useState(false)

  const [editingId, setEditingId] = useState('')
  const [savingId, setSavingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [editForm, setEditForm] = useState({
    from: '',
    to: '',
    date: '',
    rideType: 'seat',
    carModel: '',
    pickupTime: '',
    dropTime: '',
    seats: 1,
    price: 0,
  })

  const mode = user?.role === 'driver' ? 'driver' : 'passenger'

  const toYmd = (value) => {
    const d = value instanceof Date ? value : new Date(value)
    if (!d || Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        if (mode === 'driver') {
          const res = await api.myRides(token)
          if (!alive) return
          setRides(Array.isArray(res) ? res : [])
        } else {
          const res = await api.myBookings(token)
          if (!alive) return
          setBookings(Array.isArray(res) ? res : [])
        }
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
  }, [token, mode])

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

  const startEdit = (r) => {
    setError('')
    setEditingId(r?._id || '')
    setEditForm({
      from: r?.from || '',
      to: r?.to || '',
      date: toYmd(r?.date),
      rideType: r?.rideType || 'seat',
      carModel: r?.carModel || '',
      pickupTime: r?.pickupTime || '',
      dropTime: r?.dropTime || '',
      seats: Number.isFinite(Number(r?.seats)) ? Number(r.seats) : 1,
      price: Number.isFinite(Number(r?.price)) ? Number(r.price) : 0,
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setSavingId('')
  }

  const saveEdit = async (rideId) => {
    if (!rideId) return
    setError('')
    setSavingId(rideId)
    try {
      const payload = {
        from: editForm.from,
        to: editForm.to,
        date: editForm.date,
        rideType: editForm.rideType,
        carModel: editForm.carModel,
        pickupTime: editForm.pickupTime,
        dropTime: editForm.dropTime,
        seats: editForm.rideType === 'parcel' ? 0 : Number(editForm.seats),
        price: Number(editForm.price),
      }
      const updated = await api.updateRide(token, rideId, payload)
      setRides((prev) => prev.map((x) => (x._id === rideId ? updated : x)))
      setEditingId('')
    } catch (e) {
      setError(e.message || 'Update failed')
    } finally {
      setSavingId('')
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

  const removeRide = async (rideId) => {
    if (!rideId) return
    setError('')
    const ok = window.confirm('Delete this ride?')
    if (!ok) return
    setDeletingId(rideId)
    try {
      await api.deleteRide(token, rideId)
      setRides((prev) => prev.filter((x) => x._id !== rideId))
      if (editingId === rideId) setEditingId('')
    } catch (e) {
      setError(e.message || 'Delete failed')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="rc-hero rc-my">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner rc-my-inner">
        <h2 className="rc-my-title">My Rides</h2>

        {loading && <div className="rc-note">Loading…</div>}
        {error && <div className="rc-error">{error}</div>}

        {mode === 'driver' ? (
          <>
            {!loading && !error && rides.length === 0 && (
              <div className="rc-note">No rides posted yet.</div>
            )}

            {!loading && !error && rides.length > 0 && (
              <div className="rc-list">
                {rides.map((r) => (
                  <div key={r._id} className="rc-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      {editingId === r._id ? (
                        <div style={{ width: '100%' }}>
                          <div className="rc-edit-grid">
                            <input
                              value={editForm.from}
                              onChange={(e) => setEditForm((p) => ({ ...p, from: e.target.value }))}
                              placeholder="From"
                            />
                            <input
                              value={editForm.to}
                              onChange={(e) => setEditForm((p) => ({ ...p, to: e.target.value }))}
                              placeholder="To"
                            />
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                            />

                            <select
                              value={editForm.rideType}
                              onChange={(e) => {
                                const v = e.target.value
                                setEditForm((p) => ({
                                  ...p,
                                  rideType: v,
                                  seats: v === 'seat' && Number(p.seats) < 1 ? 1 : p.seats,
                                }))
                              }}
                            >
                              <option value="seat">Passengers only</option>
                              <option value="parcel">Parcel only</option>
                            </select>
                            <input
                              value={editForm.carModel}
                              onChange={(e) => setEditForm((p) => ({ ...p, carModel: e.target.value }))}
                              placeholder="Car model"
                            />
                            <input
                              type="time"
                              value={editForm.pickupTime}
                              onChange={(e) => setEditForm((p) => ({ ...p, pickupTime: e.target.value }))}
                              placeholder="Pickup time"
                            />
                            <input
                              type="time"
                              value={editForm.dropTime}
                              onChange={(e) => setEditForm((p) => ({ ...p, dropTime: e.target.value }))}
                              placeholder="Drop time"
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editForm.seats}
                              onChange={(e) => setEditForm((p) => ({ ...p, seats: e.target.value }))}
                              placeholder="Seats"
                              disabled={editForm.rideType === 'parcel'}
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editForm.price}
                              onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                              placeholder="Price"
                            />
                            <div className="rc-note" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {editForm.rideType === 'parcel' ? 'Parcel only post' : 'Passengers only post'}
                            </div>
                          </div>

                          <div className="rc-edit-actions">
                            <button
                              type="button"
                              className="rc-btn small"
                              onClick={() => saveEdit(r._id)}
                              disabled={!token || savingId === r._id}
                            >
                              {savingId === r._id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="rc-btn small ghost"
                              onClick={cancelEdit}
                              disabled={savingId === r._id}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div style={{ fontWeight: 800 }}>
                              {r?.from} → {r?.to}
                            </div>
                            <div className="rc-note">
                              {r?.date ? new Date(r.date).toLocaleDateString() : '—'} • {(r?.rideType || 'seat') === 'parcel' ? 'Parcel only' : `${r?.seats || 1} seat(s)`} • ₹{r?.price ?? 0}
                              {r?.pickupTime ? ` • Pickup: ${r.pickupTime}` : ''}
                              {r?.dropTime ? ` • Drop: ${r.dropTime}` : ''}
                              {r?.carModel ? ` • Car: ${r.carModel}` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              type="button"
                              className="rc-btn small ghost"
                              onClick={() => startEdit(r)}
                              disabled={!token || deletingId === r._id}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rc-btn small ghost"
                              onClick={() => removeRide(r._id)}
                              disabled={!token || deletingId === r._id}
                            >
                              {deletingId === r._id ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
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
                            <button
                              type="button"
                              className="rc-btn ghost small"
                              onClick={() => toggleChat(b._id)}
                              disabled={!token}
                            >
                              {chatOpenId === b._id ? 'Close chat' : 'Message driver'}
                            </button>

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

                      {chatOpenId === b._id && (
                        <div className="rc-my-sub">
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

                              <div className="rc-chat-row">
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
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
