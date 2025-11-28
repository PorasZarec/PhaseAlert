import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setRole(data.role);
      } else {
        // If data is missing but no error, default to resident
        setRole('resident');
      }
    } catch (error) {
      console.error("Error fetching role:", error.message);
      // FALLBACK: Essential to prevent infinite loading screens
      setRole('resident'); 
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchRole(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error.message);
      } finally {
        // THE FIX: This runs 100% of the time, whether successful or failed
        if (mounted) setLoading(false);
      }
    };

    getSession();

    // 2. Real-time Listener (Login/Logout events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Only fetch role if we don't have it yet (optimizes performance)
        if (!role) await fetchRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      
      // Ensure loading is off after any auth change
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to run only once on mount

  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setUser(null);
  };

  const value = { user, role, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);