import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore the session from the cookie on first load
  useEffect(() => {
    let alive = true
    api
      .get('/auth/me')
      .then((res) => alive && setUser(res.data.user))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        setUser(data.user)
        return data.user
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload)
        setUser(data.user)
        return data.user
      },
      async logout() {
        try {
          await api.post('/auth/logout')
        } finally {
          setUser(null)
        }
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)