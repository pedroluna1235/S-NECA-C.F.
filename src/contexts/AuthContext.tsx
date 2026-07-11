import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Role = 'lector' | 'editor' | 'no_autenticado';

interface AuthContextType {
  role: Role;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('no_autenticado');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const storedRole = localStorage.getItem('seneca_role') as Role;
    if (storedRole === 'lector' || storedRole === 'editor') {
      setRole(storedRole);
    }
    setIsInitialized(true);
  }, []);

  const login = (password: string): boolean => {
    // We could use env vars here, but using the requested hardcoded values for simplicity
    const PASSWORD_VIEW = import.meta.env.VITE_PASSWORD_VIEW || 'seneca2026view';
    const PASSWORD_ADMIN = import.meta.env.VITE_PASSWORD_ADMIN || 'seneca2026admin';

    if (password === PASSWORD_ADMIN) {
      setRole('editor');
      localStorage.setItem('seneca_role', 'editor');
      return true;
    } else if (password === PASSWORD_VIEW) {
      setRole('lector');
      localStorage.setItem('seneca_role', 'lector');
      return true;
    }

    return false;
  };

  const logout = () => {
    setRole('no_autenticado');
    localStorage.removeItem('seneca_role');
  };

  // Don't render children until we've checked localStorage
  if (!isInitialized) return null;

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
