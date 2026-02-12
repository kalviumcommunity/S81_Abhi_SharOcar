import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './pages.css'

export default function RideBooking(){
  const { id } = useParams()
  const nav = useNavigate()
  const { token, user } = useAuth()

  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviewErr, setReviewErr] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewEligible, setReviewEligible] = useState(false)

  const [step, setStep] = useState(1) // 1: passenger details, 2: payment
  const [seatsCount, setSeatsCount] = useState(1)
  const [passengers, setPassengers] = useState([
    { name: '', phoneCountry: '+91', phoneNumber: '', age: '', luggageCount: 0 },
  ])
  const [paymentMethod, setPaymentMethod] = useState('BillDesk')
  const [submitting, setSubmitting] = useState(false)

  const seatsOptions = useMemo(() => {
    const max = Math.max(1, Math.min(6, Number(ride?.seats || 6)))
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [ride?.seats])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const r = await api.getRide(id)
        if (!alive) return
        if ((r?.rideType || 'seat') === 'parcel') {
          nav(`/parcel/${id}`, { replace: true })
          return
        }
        setRide(r)

        const rev = await api.getRideReviews(id)
        if (!alive) return
        setReviews(Array.isArray(rev) ? rev : [])

        // Only show the review form after the ride is completed and user has a confirmed seat booking.
        if (token && user?.role === 'passenger') {
          try {
            const bookings = await api.myBookings(token)
            if (!alive) return
            const b = Array.isArray(bookings)
              ? bookings.find((x) => String(x?.ride?._id || x?.ride) === String(id))
              : null

            const isConfirmedSeat = b && b.type === 'seat' && b.status === 'confirmed'

            const rideDate = r?.date ? new Date(r.date) : null
            const now = new Date()

            let completedAt = null
            if (rideDate && !Number.isNaN(rideDate.getTime())) {
              completedAt = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate(), 23, 59, 59, 999)
              if (r?.dropTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(r.dropTime))) {
                const [hh, mm] = String(r.dropTime).split(':').map((v) => Number(v))
                completedAt = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate(), hh, mm, 0, 0)
              }
            }

            const isCompleted = completedAt ? now >= completedAt : false
            setReviewEligible(Boolean(isConfirmedSeat && isCompleted))
          } catch {
            // If we can't determine eligibility, don't ask for review.
            setReviewEligible(false)
          }
        } else {
          setReviewEligible(false)
        }
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load ride')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, nav, token, user?.role])

  const avatarUrl = (() => {
    if (!ride?.driver?.avatarPath) return ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    return `${base}${ride.driver.avatarPath}`
  })()

  const avgRating = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + (Number(r?.rating) || 0), 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const submitReview = async () => {
    setReviewMsg('')
    setReviewErr('')
    if (!token || user?.role !== 'passenger') {
      setReviewErr('Only passengers can review rides')
      return
    }
    setReviewSubmitting(true)
    try {
      const created = await api.upsertRideReview(token, id, {
        rating: Number(reviewRating),
        comment: reviewComment,
      })
      setReviewMsg('Review submitted')
      setReviewComment('')
      // refresh list (simple + reliable)
      const rev = await api.getRideReviews(id)
      setReviews(Array.isArray(rev) ? rev : [])
      // keep rating as-is
      return created
    } catch (e) {
      setReviewErr(e.message || 'Review failed')
    } finally {
      setReviewSubmitting(false)
    }
  }

  useEffect(() => {
    setPassengers((prev) => {
      const next = [...prev]
      while (next.length < seatsCount) {
        next.push({ name: '', phoneCountry: '+91', phoneNumber: '', age: '', luggageCount: 0 })
      }
      while (next.length > seatsCount) next.pop()
      return next
    })
  }, [seatsCount])

  const updatePassenger = (index, patch) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const goPayment = () => {
    setError('')
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i]
      if (!p.name?.trim() || !p.phoneNumber?.trim() || p.age === '') {
        setError('Please fill all passenger details')
        return
      }
    }
    setStep(2)
  }

  const submitBooking = async () => {
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        rideId: id,
        type: 'seat',
        seatsCount,
        paymentMethod,
        passengers: passengers.map((p) => ({
          name: p.name,
          phone: `${p.phoneCountry}${p.phoneNumber}`,
          age: Number(p.age),
          luggageCount: Number(p.luggageCount || 0),
        })),
      }
      await api.book(token, payload)
      nav('/my-rides')
    } catch (e) {
      setError(e.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rc-hero rc-book">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner rc-book-inner">
        <h2 className="rc-book-title">Book a Seat</h2>

        {loading && <div className="rc-note">Loading ride…</div>}
        {error && <div className="rc-error">{error}</div>}

        {!loading && ride && (
          <>
            <div className="rc-book-ride">
              <div className="rc-book-ride-row">
                <div className="rc-book-pin" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 22s7-4.7 7-12a7 7 0 1 0-14 0c0 7.3 7 12 7 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className="rc-book-route">{ride.from} <span aria-hidden="true">→</span> {ride.to}</div>
                  <div className="rc-note">
                    {new Date(ride.date).toLocaleString()} • Seats left: {ride.seats} • Price/seat: ₹{ride.price ?? 0}
                  </div>
                  <div className="rc-note">
                    {ride?.pickupTime ? `Pickup: ${ride.pickupTime}` : 'Pickup: —'}
                    {' • '}
                    {ride?.dropTime ? `Drop: ${ride.dropTime}` : 'Drop: —'}
                    {ride?.carModel ? ` • Car: ${ride.carModel}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="rc-book-panel" style={{ marginTop: 14 }}>
              <div className="rc-book-panel-title" style={{ marginBottom: 10 }}>Driver</div>
              <div className="rc-row" style={{ gap: 12, alignItems: 'center' }}>
                <div className="rc-nav-avatar" style={{ width: 42, height: 42, fontSize: 14 }} aria-hidden="true">
                  {avatarUrl ? <img className="rc-nav-avatar-img" src={avatarUrl} alt="" /> : (ride?.driver?.name || 'D').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{ride?.driver?.name || 'Driver'}</div>
                  <div className="rc-note">Rating: {avgRating ? `${avgRating} / 5` : '—'} {reviews.length ? `(${reviews.length} review${reviews.length > 1 ? 's' : ''})` : ''}</div>
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="rc-book-panel">
                <div className="rc-book-panel-top">
                  <div className="rc-book-panel-title">Passenger details</div>
                  <div className="rc-book-seats">
                    <div className="rc-note">Seats</div>
                    <select value={seatsCount} onChange={(e) => setSeatsCount(Number(e.target.value))}>
                      {seatsOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {passengers.map((p, idx) => (
                  <div key={idx} className="rc-book-passenger">
                    <div className="rc-book-passenger-h">
                      <span className="rc-book-person" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </span>
                      <div>Passenger {idx + 1}</div>
                    </div>

                    <div className="rc-book-grid">
                      <div className="rc-book-field">
                        <div className="rc-book-label">Name</div>
                        <input
                          placeholder="Name"
                          value={p.name}
                          onChange={(e) => updatePassenger(idx, { name: e.target.value })}
                        />
                      </div>

                      <div className="rc-book-field">
                        <div className="rc-book-label">Phone</div>
                        <div className="rc-book-phone">
                          <select
                            value={p.phoneCountry}
                            onChange={(e) => updatePassenger(idx, { phoneCountry: e.target.value })}
                            aria-label="Country code"
                          >
                            <option value="+91">+91</option>
                          </select>
                          <input
                            placeholder="Phone"
                            value={p.phoneNumber}
                            onChange={(e) => updatePassenger(idx, { phoneNumber: e.target.value })}
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      <div className="rc-book-field">
                        <div className="rc-book-label">Age</div>
                        <input
                          placeholder="Age"
                          type="number"
                          min="0"
                          value={p.age}
                          onChange={(e) => updatePassenger(idx, { age: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="rc-book-luggage">
                      <input
                        placeholder="Luggage count"
                        type="number"
                        min="0"
                        value={p.luggageCount}
                        onChange={(e) => updatePassenger(idx, { luggageCount: e.target.value })}
                      />
                    </div>
                  </div>
                ))}

                <motion.button whileTap={{ scale: 0.98 }} className="rc-btn rc-book-cta" type="button" onClick={goPayment}>
                  Continue to Payment
                </motion.button>
              </div>
            )}

            {step === 2 && (
              <div className="rc-book-panel">
                <div className="rc-book-panel-title" style={{ marginBottom: 12 }}>Payment method</div>

                <label className="rc-row" style={{ gap: 10, marginBottom: 10 }}>
                  <input
                    type="radio"
                    name="payment"
                    value="BillDesk"
                    checked={paymentMethod === 'BillDesk'}
                    onChange={() => setPaymentMethod('BillDesk')}
                  />
                  <div>BillDesk</div>
                </label>

                <div className="rc-row" style={{ gap: 10, marginTop: 14 }}>
                  <button type="button" className="rc-btn ghost" onClick={() => setStep(1)} disabled={submitting}>
                    Back
                  </button>
                  <button type="button" className="rc-btn" onClick={submitBooking} disabled={submitting || !token || !user}>
                    {submitting ? 'Booking…' : 'Book a Ride'}
                  </button>
                  <button type="button" className="rc-btn ghost" onClick={() => nav(-1)} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="rc-book-panel" style={{ marginTop: 14 }}>
              <div className="rc-book-panel-title" style={{ marginBottom: 10 }}>Reviews</div>

              {reviewErr && <div className="rc-error">{reviewErr}</div>}
              {reviewMsg && <div className="rc-success">{reviewMsg}</div>}

              {token && user?.role === 'passenger' && reviewEligible && (
                <div style={{ marginBottom: 14 }}>
                  <div className="rc-row" style={{ gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div className="rc-note">Your rating</div>
                    <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write a short review (optional)"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <button type="button" className="rc-btn small" onClick={submitReview} disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                    </button>
                  </div>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="rc-note">No reviews yet.</div>
              ) : (
                <div className="rc-list">
                  {reviews.map((rv) => (
                    <div key={rv._id} className="rc-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800 }}>{rv?.user?.name || 'User'}</div>
                        <div style={{ fontWeight: 800 }}>{Number(rv?.rating) || 0} / 5</div>
                      </div>
                      {rv?.comment ? <div style={{ marginTop: 8, opacity: 0.9 }}>{rv.comment}</div> : null}
                      <div className="rc-note" style={{ marginTop: 8 }}>
                        {rv?.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
