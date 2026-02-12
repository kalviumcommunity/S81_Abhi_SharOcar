import { createContext, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const t = localStorage.getItem('rc_token')
      const u = localStorage.getItem('rc_user')
      if (t && u) {
        setToken(t)
        setUser(JSON.parse(u))
      }
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const login = (t, u) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('rc_token', t)
    localStorage.setItem('rc_user', JSON.stringify(u))
    setIsHydrated(true)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
    setIsHydrated(true)
  }

  const setUserProfile = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem('rc_user', JSON.stringify(nextUser))
  }

  return (
    <AuthCtx.Provider value={{ user, token, isHydrated, login, logout, setUserProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
