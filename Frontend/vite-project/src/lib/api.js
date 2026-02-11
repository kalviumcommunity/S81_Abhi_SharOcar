const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
  searchRides: (q = {}) => {
    const p = new URLSearchParams(q).toString()
    return request(`/api/rides?${p}`)
  },
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
}
