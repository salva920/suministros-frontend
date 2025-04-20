// components/ProtectedRoute.js
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('token');
    }
  }, [location]);

  return token ? <Outlet /> : <Navigate to="/" replace />;
};