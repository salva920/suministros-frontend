import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const sessionActive = sessionStorage.getItem('isLoggedIn');
      setIsAuth(!!token && !!sessionActive);
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (isAuth === null) return null; // Esperar verificación inicial
  
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;