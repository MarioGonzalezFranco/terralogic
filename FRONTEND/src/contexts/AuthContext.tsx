import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  profile:         UserProfile | null;
  loading:         boolean;
  isAuthenticated: boolean;
  signOut:         () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('user');
      if (raw) {
        const data = JSON.parse(raw);
        setProfile({
          uid:         data.uid,
          displayName: data.displayName,
          email:       data.email,
          photoURL:    data.photoURL ?? undefined,
          role:        data.role,
          createdAt:   data.createdAt,
        });
      }
    } catch {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setProfile(null);
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{
      profile,
      loading,
      isAuthenticated: profile !== null,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}