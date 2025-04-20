// components/PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  return !localStorage.getItem('token') ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default PublicRoute;