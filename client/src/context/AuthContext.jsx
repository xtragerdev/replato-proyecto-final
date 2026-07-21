import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, readStoredSession, storeSession } from '../api/apiClient.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(session?.token))

  const saveSession = useCallback((nextSession) => {
    storeSession(nextSession)
    setSession(nextSession)
  }, [])

  useEffect(() => {
    if (!session?.token) {
      setIsCheckingSession(false)
      return
    }

    const controller = new AbortController()
    apiRequest('/auth/me', { signal: controller.signal })
      .then(({ data }) => saveSession({ ...session, user: data }))
      .catch((error) => {
        if (error.name !== 'AbortError') saveSession(null)
      })
      .finally(() => setIsCheckingSession(false))
    return () => controller.abort()
  }, [saveSession, session?.token])

  const login = useCallback(async (credentials) => {
    const { data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    saveSession(data)
    return data.user
  }, [saveSession])

  const register = useCallback(async (account) => {
    const { data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(account),
    })
    saveSession(data)
    return data.user
  }, [saveSession])

  const logout = useCallback(() => saveSession(null), [saveSession])

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    isCheckingSession,
    login,
    register,
    logout,
  }), [isCheckingSession, login, logout, register, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

