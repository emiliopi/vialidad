import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import VerificarVialidad from './pages/VerificarVialidad';

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
          {/* Únicas Rutas del Verificador Público */}
          <Route path="/verificar/:llave" element={<VerificarVialidad />} />
          <Route path="/verificar" element={<VerificarVialidad />} />
          
          {/* Redirecciones por Defecto de Público */}
          <Route path="/" element={<Navigate to="/verificar" replace />} />
          <Route path="*" element={<Navigate to="/verificar" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
