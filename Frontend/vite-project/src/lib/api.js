const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

async function request(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, opts)
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : await res.text()
  if (!res.ok) throw new Error(data?.message || data || 'Request failed')
  return data
}

export const api = {
  signup: (formData) =>
    fetch(`${API_URL}/api/auth/signup`, { method: 'POST', body: formData }).then(r => r.json()),
  login: (payload) => request('/api/auth/login', {
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
  createRide: (token, payload) => request('/api/rides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
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
}
