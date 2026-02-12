import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './pages.css'

export default function ParcelBooking(){
  const { id } = useParams()
  const nav = useNavigate()
  const { token } = useAuth()

  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parcelDetails, setParcelDetails] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BillDesk')
  const [submitting, setSubmitting] = useState(false)

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const r = await api.getRide(id)
        if (!alive) return
        if ((r?.rideType || 'seat') !== 'parcel') {
          nav(`/ride/${id}`, { replace: true })
          return
        }
        setRide(r)
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load post')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, nav])

  const submit = async () => {
    setError('')
    if (!parcelDetails.trim()) {
      setError('Please enter parcel details')
      return
    }
    setSubmitting(true)
    try {
      if (paymentMethod === 'Razorpay') {
        const ok = await loadRazorpay()
        if (!ok) {
          setError('Failed to load Razorpay')
          return
        }

        const order = await api.createRazorpayOrder(token, {
          rideId: id,
          type: 'parcel',
        })

        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'ShareOcar',
          description: 'Parcel booking',
          order_id: order.orderId,
          handler: async (response) => {
            try {
              await api.confirmRazorpayBooking(token, {
                rideId: id,
                type: 'parcel',
                parcelDetails,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              nav('/my-rides')
            } catch (e) {
              setError(e.message || 'Payment confirmation failed')
            }
          },
        }

        const rz = new window.Razorpay(options)
        rz.on('payment.failed', (resp) => {
          setError(resp?.error?.description || 'Payment failed')
        })
        rz.open()
        return
      }

      await api.book(token, {
        rideId: id,
        type: 'parcel',
        parcelDetails,
        paymentMethod,
      })
      nav('/my-rides')
    } catch (e) {
      setError(e.message || 'Parcel booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rc-hero rc-book">
      <div className="rc-hero-overlay" />

      <div className="rc-container rc-hero-inner rc-book-inner">
        <h2 className="rc-book-title">Book a Parcel</h2>

        {loading && <div className="rc-note">Loading…</div>}
        {error && <div className="rc-error">{error}</div>}

        {!loading && ride && (
          <>
            <div className="rc-book-ride">
              <div className="rc-book-ride-row">
                <div>
                  <div className="rc-book-route">{ride.from} <span aria-hidden="true">→</span> {ride.to}</div>
                  <div className="rc-note">{new Date(ride.date).toLocaleString()} • Price: ₹{ride.price ?? 0} • Parcel only</div>
                </div>
              </div>
            </div>

            <div className="rc-book-panel">
              <div className="rc-book-panel-title" style={{ marginBottom: 10 }}>Parcel details</div>
              <textarea
                value={parcelDetails}
                onChange={(e) => setParcelDetails(e.target.value)}
                placeholder="Describe parcel (size/weight/notes)"
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />

              <div style={{ marginTop: 12 }}>
                <div className="rc-note" style={{ marginBottom: 6 }}>Payment method</div>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="BillDesk">BillDesk</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Razorpay">Razorpay</option>
                </select>
              </div>

              <div className="rc-row" style={{ gap: 10, marginTop: 14 }}>
                <button type="button" className="rc-btn" onClick={submit} disabled={submitting || !token}>
                  {submitting ? 'Booking…' : 'Book Parcel'}
                </button>
                <button type="button" className="rc-btn ghost" onClick={() => nav(-1)} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
