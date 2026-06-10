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
import Configuracion from './pages/Configuracion';
import Permisos from './pages/Permisos';
import Distritos from './pages/Distritos';
import Conceptos from './pages/Conceptos';




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
          
          {/* Rutas Protegidas de Autenticación */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dev-guide" element={<DevGuide />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/vialidades" element={<Vialidades />} />
            <Route path="/distritos" element={<Distritos />} />
            <Route path="/conceptos" element={<Conceptos />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>

          {/* Rutas Protegidas de Super Admin */}
          <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
            <Route path="/permisos" element={<Permisos />} />
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
