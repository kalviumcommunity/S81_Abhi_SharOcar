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

  const [step, setStep] = useState(1) // 1: passenger details, 2: payment
  const [seatsCount, setSeatsCount] = useState(1)
  const [passengers, setPassengers] = useState([
    { name: '', phoneCountry: '+91', phoneNumber: '', age: '', luggageCount: 0 },
  ])
  const [paymentMethod, setPaymentMethod] = useState('BillDesk')
  const [status, setStatus] = useState('')
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
        setRide(r)
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
  }, [id])

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
    setStatus('')
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
    setStatus('')
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
      const res = await api.book(token, payload)
      setStatus(`Request sent (pending approval) • ${res._id}`)
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
        {status && <div className="rc-success">{status}</div>}

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
                    {new Date(ride.date).toLocaleString()} • Seats left: {ride.seats}
                  </div>
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
          </>
        )}
      </div>
    </div>
  )
}
