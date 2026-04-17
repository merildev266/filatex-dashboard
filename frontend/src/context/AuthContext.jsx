import { createContext, useState, useCallback, useMemo } from 'react'

export const AuthContext = createContext(null)

const AUTH_KEY = 'dash_auth'
const TOKEN_KEY = 'dash_token'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function loadInitialState() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const saved = sessionStorage.getItem(AUTH_KEY)
  if (token && saved) {
    try {
      return { isAuthenticated: true, user: JSON.parse(saved), token }
    } catch { /* fall through */ }
  }
  return { isAuthenticated: false, user: null, token: null }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  const login = useCallback(async (username, pin) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      })
      const data = await res.json()
      if (!data.success) return { success: false, error: data.error }

      sessionStorage.setItem(TOKEN_KEY, data.token)
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user))
      setState({ isAuthenticated: true, user: data.user, token: data.token })
      return { success: true, must_set_pin: data.must_set_pin, token: data.token, user: data.user }
    } catch {
      return { success: false, error: 'Serveur inaccessible' }
    }
  }, [])

  const changePin = useCallback(async (oldPin, newPin, newPinConfirm) => {
    if (newPin !== newPinConfirm) {
      return { success: false, error: 'Les deux nouveaux PIN ne correspondent pas' }
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
      })
      const data = await res.json()
      if (data.ok) return { success: true }
      return { success: false, error: data.error || 'Erreur inconnue' }
    } catch {
      return { success: false, error: 'Serveur inaccessible' }
    }
  }, [state.token])

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
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user))
        setState({ isAuthenticated: true, user: data.user, token: data.token })
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Serveur inaccessible' }
    }
  }, [state.token])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    setState({ isAuthenticated: false, user: null, token: null })
  }, [])

  const hasAccess = useCallback((section) => {
    if (!state.user?.sections) return false
    if (state.user.sections.includes('*')) return true
    if (state.user.sections.includes(section)) return true
    // Check parent: 'energy.hfo' → also check 'energy'
    const parent = section.split('.')[0]
    if (parent !== section && state.user.sections.includes(parent)) return true
    return false
  }, [state.user])

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers }
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`
    return fetch(`${API_BASE}${url}`, { ...options, headers })
  }, [state.token])

  const refreshData = useCallback(async (token) => {
    try {
      await fetch(`${API_BASE}/api/refresh-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || state.token}` },
      })
    } catch { /* server offline — ignore */ }
  }, [state.token])

  const value = useMemo(() => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    login,
    setPin,
    logout,
    hasAccess,
    authFetch,
    refreshData,
  }), [state, login, setPin, logout, hasAccess, authFetch, refreshData])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
