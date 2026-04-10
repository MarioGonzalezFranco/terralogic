// ─────────────────────────────────────────────────────────────
// AuthContext.tsx
// Contexto de autenticación MOCK para el frontend.
//
// ⚠️ PARA EL BACKEND:
// Reemplazar signIn con Firebase Auth real:
//   - signInWithEmailAndPassword
//   - createUserWithEmailAndPassword + setDoc en Firestore
//   - onAuthStateChanged para persistir la sesión
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, type ReactNode } from 'react';
import { UserProfile } from '../types';

// ─── Tipos del contexto ───────────────────────────────────────

interface AuthContextType {
  profile:         UserProfile | null;
  loading:         boolean;
  isAuthenticated: boolean;
  signIn:          () => void; // Mock — el backend usa Firebase Auth
  signOut:         () => void;
}

// ─── Usuario mock ─────────────────────────────────────────────

// Datos de prueba — el backend los reemplaza con datos reales de Firestore
const MOCK_USER: UserProfile = {
  uid:         'mock-uid-001',
  displayName: 'Carlos Mendoza',
  email:       'carlos@terralogic.ai',
  photoURL:    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
  role:        'productor',
  createdAt:   '2024-01-15T10:00:00.000Z',
};

// ─── Contexto ─────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // Arranca en null para mostrar la pantalla de login
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = profile !== null;

  // Simula login exitoso con el usuario mock
  const signIn = () => {
    setLoading(true);
    setTimeout(() => {
      setProfile(MOCK_USER);
      setLoading(false);
    }, 800);
  };

  // Cierra sesión y regresa al login
  const signOut = () => {
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
