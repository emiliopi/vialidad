import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import DevGuide from './pages/DevGuide';
import Usuarios from './pages/Usuarios';
import Vialidades from './pages/Vialidades';
import VerificarVialidad from './pages/VerificarVialidad';


// Componente para proteger rutas públicas de usuarios ya autenticados
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <>
      {/* Proveedor global de Notificaciones de Toasts */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-slate-100 border dark:border-slate-800 rounded-xl text-sm px-4 py-3 shadow-xl',
          duration: 4000,
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verificar/:llave" element={<VerificarVialidad />} />
          <Route path="/verificar" element={<VerificarVialidad />} />
          
          {/* Rutas Protegidas de Autenticación */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dev-guide" element={<DevGuide />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/vialidades" element={<Vialidades />} />
          </Route>

          {/* Redirecciones por Defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
