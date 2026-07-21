import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/common/StatusState.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function ProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useAuth()
  const location = useLocation()
  if (isCheckingSession) return <LoadingState label="Comprobando sesión…" />
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function RoleRoute({ roles }) {
  const { user } = useAuth()
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/sin-permiso" replace />
}
