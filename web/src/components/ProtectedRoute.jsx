import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'} replace />
  }
  return children
}
