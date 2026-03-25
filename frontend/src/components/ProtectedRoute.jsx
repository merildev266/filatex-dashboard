import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { prefetchAllPages } from '../App'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const prefetched = useRef(false)

  useEffect(() => {
    if (isAuthenticated && !prefetched.current) {
      prefetched.current = true
      prefetchAllPages()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
