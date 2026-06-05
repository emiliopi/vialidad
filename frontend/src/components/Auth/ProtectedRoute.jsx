import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem('token');

  // try/catch: evita crash si el valor en storage está corrupto o manipulado
  let user = {};
  try {
    const stored = localStorage.getItem('user');
    user = stored ? JSON.parse(stored) : {};
  } catch {
    // Si el JSON está corrupto, tratar como sesión inválida
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles especificados y el rol del usuario no está permitido, redirigir
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
