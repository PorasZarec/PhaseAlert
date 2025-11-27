// client/src/components/RootRedirector.jsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const RootRedirector = () => {
  const { user } = useAuth();

  console.log('ROOT REDIRECTOR - User object:', user);
  
  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, redirect to their specific dashboard
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'INSTRUCTOR':
      return <Navigate to="/instructor" replace />;
    case 'STUDENT':
      return <Navigate to="/student-view" replace />;
    default:
      // Fallback in case role is missing
      return <Navigate to="/login" replace />;
  }
};

export default RootRedirector;