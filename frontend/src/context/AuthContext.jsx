import { createContext, useState, useCallback, useMemo } from 'react'

export const AuthContext = createContext(null)

const API_BASE = 'http://localhost:5000'
const TOKEN_KEY = 'dash_token'
const AUTH_KEY = 'dash_auth'
const USER_KEY = 'dash_user'

function loadInitialState() {
  const authFlag = sessionStorage.getItem(AUTH_KEY) === '1'
  const savedUser = sessionStorage.getItem(USER_KEY)
  const token = sessionStorage.getItem(TOKEN_KEY)

  if (authFlag && savedUser) {
    return { isAuthenticated: true, user: JSON.parse(savedUser), token }
  }
  return { isAuthenticated: false, user: null, token: null }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  const login = useCallback(async (username, pin) => {
    // 1. Try API login first
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      })
      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem(TOKEN_KEY, data.token)
        sessionStorage.setItem(AUTH_KEY, '1')
        sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setState({ isAuthenticated: true, user: data.user, token: data.token })
        return { success: true, must_set_pin: data.must_set_pin || false }
      }
      // API responded but login failed (wrong creds, locked, etc.)
      return { success: false, error: data.error || 'Identifiants incorrects' }
    } catch (_networkErr) {
      return { success: false, error: 'Serveur inaccessible' }
    }
  }, [])

  const setPin = useCallback(async (pin, pinConfirm) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ pin, pin_confirm: pinConfirm }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem(TOKEN_KEY, data.token)
        sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setState(s => ({ ...s, token: data.token, user: data.user }))
        return { success: true }
      }
      return { success: false, error: data.error || 'Erreur' }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }, [state.token])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(USER_KEY)
    setState({ isAuthenticated: false, user: null, token: null })
  }, [])

  const hasAccess = useCallback((section) => {
    if (!state.user) return false
    const sections = state.user.sections || []
    return sections.includes('*') || sections.includes(section)
  }, [state.user])

  const isAdmin = useCallback(() => {
    return state.user?.role === 'super_admin' || state.user?.role === 'admin'
  }, [state.user])

  const isSuperAdmin = useCallback(() => {
    return state.user?.role === 'super_admin'
  }, [state.user])

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers }
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`
    }
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers })
    if (res.status === 401) {
      // Token expired — force logout
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(AUTH_KEY)
      sessionStorage.removeItem(USER_KEY)
      setState({ isAuthenticated: false, user: null, token: null })
      throw new Error('Session expiree')
    }
    return res
  }, [state.token])

  const value = useMemo(() => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    login,
    logout,
    setPin,
    hasAccess,
    isAdmin,
    isSuperAdmin,
    authFetch,
  }), [state, login, logout, setPin, hasAccess, isAdmin, isSuperAdmin, authFetch])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
