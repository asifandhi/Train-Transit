import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { status } = useAuth()

  if (!status) {
    return <Navigate to="/login" replace />
  }

  return children ? children : <Outlet />
}
