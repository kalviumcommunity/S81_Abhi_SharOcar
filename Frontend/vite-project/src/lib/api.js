const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'
const API_URL = String(RAW_API_URL).replace(/\/+$/, '')

async function request(path, opts = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, opts)
  } catch (e) {
    const hint = `Network error calling API (${API_URL}). Check VITE_API_URL in your deployed frontend and ensure the backend allows your site via CORS (CLIENT_URLS).`
    throw new Error(e?.message ? `${hint} (${e.message})` : hint)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : await res.text()
  if (!res.ok) throw new Error(data?.message || data || 'Request failed')
  return data
}

export const api = {
  signup: (formData) => request('/api/auth/signup', { method: 'POST', body: formData }),
  login: (payload) => request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  googleAuth: (payload) => request('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  me: (token) => request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  updateMe: (token, payload) => request('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  uploadAvatar: (token, file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return request('/api/users/me/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    })
  },
  removeAvatar: (token) => request('/api/users/me/avatar', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),
  searchRides: (q = {}) => {
    const p = new URLSearchParams(q).toString()
    return request(`/api/rides?${p}`)
  },
  getRide: (rideId) => request(`/api/rides/${rideId}`),
  getRideReviews: (rideId) => request(`/api/rides/${rideId}/reviews`),
  upsertRideReview: (token, rideId, payload) => request(`/api/rides/${rideId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  createRide: (token, payload) => request('/api/rides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  updateRide: (token, rideId, payload) => request(`/api/rides/${rideId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  deleteRide: (token, rideId) => request(`/api/rides/${rideId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),
  myRides: (token) => request('/api/rides/mine', { headers: { Authorization: `Bearer ${token}` } }),
  book: (token, payload) => request('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  myBookings: (token) => request('/api/bookings/me', { headers: { Authorization: `Bearer ${token}` } }),
  approveBooking: (token, bookingId) => request(`/api/bookings/${bookingId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }),
  rejectBooking: (token, bookingId) => request(`/api/bookings/${bookingId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }),
  cancelBooking: (token, bookingId) => request(`/api/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }),

  getNotifications: (token) => request('/api/notifications', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  markNotificationRead: (token, notificationId) => request(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }),
  markAllNotificationsRead: (token) => request('/api/notifications/read-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }),

  getBookingMessages: (token, bookingId) => request(`/api/bookings/${bookingId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  sendBookingMessage: (token, bookingId, text) => request(`/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text })
  }),

  createRazorpayOrder: (token, payload) => request('/api/payments/razorpay/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  confirmRazorpayBooking: (token, payload) => request('/api/bookings/razorpay/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
}
