import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext' 

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Safety check for missing role
  if (!role) {
    return <div className="p-10 text-center">Loading user profile...</div>
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/resident/dashboard'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute