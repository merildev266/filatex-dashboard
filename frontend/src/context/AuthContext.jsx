import { createContext, useState, useCallback, useMemo } from 'react'

export const AuthContext = createContext(null)

const AUTH_KEY = 'dash_auth'

const FALLBACK_USER = {
  username: 'pmo',
  display_name: 'PMO',
  role: 'pmo',
  sections: ['*'],
}

function loadInitialState() {
  return sessionStorage.getItem(AUTH_KEY) === '1'
    ? { isAuthenticated: true, user: FALLBACK_USER }
    : { isAuthenticated: false, user: null }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  const login = useCallback((password) => {
    if (password === '1979') {
      sessionStorage.setItem(AUTH_KEY, '1')
      setState({ isAuthenticated: true, user: FALLBACK_USER })
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY)
    setState({ isAuthenticated: false, user: null })
  }, [])

  const hasAccess = useCallback(() => true, [])

  const value = useMemo(() => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: null,
    login,
    logout,
    hasAccess,
  }), [state, login, logout, hasAccess])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
