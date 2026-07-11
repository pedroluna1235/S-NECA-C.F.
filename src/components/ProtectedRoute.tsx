import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { role } = useAuth();

  if (role === 'no_autenticado') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
