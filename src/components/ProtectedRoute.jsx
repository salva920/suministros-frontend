// components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState(true); // Estado inicial como autenticado

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);
  }, []);

  if (!isAuth) return <Navigate to="/" replace />;
  
  return <Outlet />;
};

export default ProtectedRoute;