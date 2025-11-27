import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// This component wraps the pages you want to protect
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="p-10">Loading...</div>

  // 1. If not logged in, kick to login page
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 2. If logged in but wrong role (e.g. resident trying to access admin), kick them out
  // If allowedRoles is passed (e.g. ['admin']), check it. 
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their appropriate dashboard based on their actual role
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/resident/dashboard'} replace />
  }

  // 3. If all good, render the page
  return <Outlet />
}

export default ProtectedRoute