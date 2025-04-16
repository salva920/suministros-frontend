// ferreteria-frontend/src/components/PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') && sessionStorage.getItem('isLoggedIn');
  
  // Si no está autenticado, permitir el acceso a las rutas públicas; de lo contrario, redirigir a /dashboard
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default PublicRoute;