import { createContext, useContext, useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'))
  const [loading, setLoading] = useState(!!localStorage.getItem('sf_token'))

  useEffect(() => {
    if (!token) return

    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('sf_token')
          setToken(null)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setUser(data.user ?? data)
      })
      .finally(() => setLoading(false))
  }, [])

  function login(newToken, newUser) {
    localStorage.setItem('sf_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('sf_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
