import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import './pages.css'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Profile() {
  const { user, token, setUserProfile } = useAuth()
  const fileRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const avatarUrl = useMemo(() => {
    if (!user?.avatarPath) return ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    return `${base}${user.avatarPath}`
  }, [user?.avatarPath])

  const uploadsBase = useMemo(() => {
    return import.meta.env.VITE_API_URL || 'http://localhost:5001'
  }, [])

  const normalizeDocPath = (p) => {
    if (!p) return ''
    const s = String(p).replace(/\\/g, '/')
    if (s.startsWith('/uploads/')) return s
    if (s.startsWith('uploads/')) return `/${s}`
    return s.startsWith('/') ? s : `/${s}`
  }

  const aadhaarUrl = user?.documents?.aadhaarPath ? `${uploadsBase}${normalizeDocPath(user.documents.aadhaarPath)}` : ''
  const licenseUrl = user?.documents?.licensePath ? `${uploadsBase}${normalizeDocPath(user.documents.licensePath)}` : ''

  const onPickPhoto = () => {
    setStatus('')
    setError('')
    fileRef.current?.click()
  }

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('')
    setError('')
    setIsUploading(true)
    try {
      const res = await api.uploadAvatar(token, file)
      if (res?.user) setUserProfile(res.user)
      setStatus('Photo updated')
    } catch (err) {
      setError(err.message || 'Photo upload failed')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const onRemovePhoto = async () => {
    setStatus('')
    setError('')
    setIsUploading(true)
    try {
      const res = await api.removeAvatar(token)
      if (res?.user) setUserProfile(res.user)
      setStatus('Photo removed')
    } catch (err) {
      setError(err.message || 'Remove photo failed')
    } finally {
      setIsUploading(false)
    }
  }

  const onSave = async () => {
    setStatus('')
    setError('')
    setIsSaving(true)
    try {
      const res = await api.updateMe(token, { name, phone })
      if (res?.user) setUserProfile(res.user)
      setStatus('Details saved')
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rc-profile">
      <div className="rc-dash-overlay" />

      <main className="rc-profile-main">
        <div className="rc-profile-card">
          <div className="rc-profile-photo" aria-label="Profile photo">
            {avatarUrl ? (
              <img className="rc-profile-img" src={avatarUrl} alt="" />
            ) : (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4.2 21c1.6-4.3 5-6.4 7.8-6.4s6.2 2.1 7.8 6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <div className="rc-profile-initials">{initials(user?.name || 'U')}</div>
              </>
            )}
          </div>

          <div className="rc-profile-photo-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="rc-profile-file"
              onChange={onPhotoSelected}
            />
            <button type="button" className="rc-btn small ghost" onClick={onPickPhoto} disabled={isUploading || !token}>
              {isUploading ? 'Working…' : 'Change photo'}
            </button>
            <button
              type="button"
              className="rc-btn small ghost"
              onClick={onRemovePhoto}
              disabled={isUploading || !token || !user?.avatarPath}
            >
              Remove
            </button>
          </div>

          <h1 className="rc-profile-title">Profile</h1>

          {error && <div className="rc-error">{error}</div>}
          {status && <div className="rc-success">{status}</div>}

          <div className="rc-profile-form">
            <label className="rc-profile-field">
              <div className="rc-profile-k">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="rc-profile-field">
              <div className="rc-profile-k">Phone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>

            <label className="rc-profile-field">
              <div className="rc-profile-k">Email</div>
              <input value={user?.email || ''} readOnly />
            </label>

            {user?.role === 'driver' && (
              <div className="rc-profile-field">
                <div className="rc-profile-k">Documents</div>
                <div className="rc-note" style={{ marginTop: 6 }}>
                  Aadhaar: {aadhaarUrl ? (
                    <a href={aadhaarUrl} target="_blank" rel="noreferrer">View</a>
                  ) : 'Not uploaded'}
                </div>
                <div className="rc-note" style={{ marginTop: 6 }}>
                  Driving license: {licenseUrl ? (
                    <a href={licenseUrl} target="_blank" rel="noreferrer">View</a>
                  ) : 'Not uploaded'}
                </div>
                <div className="rc-note" style={{ marginTop: 6 }}>
                  Status: {user?.documents?.status || 'pending'}
                </div>
              </div>
            )}
          </div>

          <button type="button" className="rc-btn" onClick={onSave} disabled={isSaving || !token}>
            {isSaving ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </main>
    </div>
  )
}
