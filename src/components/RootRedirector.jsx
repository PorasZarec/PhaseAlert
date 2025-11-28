import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RootRedirector = () => {
  const { user, role, loading } = useAuth();

  // 1. Wait for Auth Check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 2. Not Logged In? -> Go to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged In? -> Redirect based on Supabase Role
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } 
  
  if (role === 'resident') {
    return <Navigate to="/resident/dashboard" replace />;
  }

  // 4. Fallback (User exists but Role is missing/loading)
  // This prevents crashing if the role fetch is slow
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <p>Setting up your profile...</p>
    </div>
  );
};

export default RootRedirector;