import { createContext, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('rc_token')
    const u = localStorage.getItem('rc_user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
  }, [])

  const login = (t, u) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('rc_token', t)
    localStorage.setItem('rc_user', JSON.stringify(u))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
  }

  const setUserProfile = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem('rc_user', JSON.stringify(nextUser))
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, setUserProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
