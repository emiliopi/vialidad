import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Modal } from '../components/Common';
import { toast } from 'react-hot-toast';

export const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  let user = { username: 'Usuario', role: 'Invitado', email: '' };
  try {
    const stored = localStorage.getItem('user');
    if (stored) user = JSON.parse(stored);
  } catch {
    // JSON corrupto: usar valores por defecto
    localStorage.removeItem('user');
  }

  const handleTestClick = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      toast.success('¡Acción completada con éxito!');
    }, 1500);
  };

  const cardsInfo = [
    { title: 'Usuarios Activos', value: '1,248', desc: '+12% este mes' },
    { title: 'Conexión Base de Datos', value: 'SQL Server', desc: 'Activa y segura' },
    { title: 'Rol de Sesión', value: user.role, desc: 'Nivel de acceso autorizado' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Panel de Control
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Bienvenido, {user.username}. Esta es la base de tu nuevo proyecto.
          </p>
        </div>

        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardsInfo.map((card, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {card.title}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-display">
                {card.value}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Sección de Contenido Demo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Controles Base Reutilizables
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Prueba los componentes de la plantilla que heredan el estilo visual de la guía de capacitaciones.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              loading={btnLoading}
              onClick={handleTestClick}
            >
              Probar Acción Cargando
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
            >
              Abrir Modal Base
            </Button>

            <Button
              variant="outline"
              onClick={() => { toast('Notificación rápida informativa', { icon: 'ℹ️' }); }}
            >
              Lanzar Toast
            </Button>
          </div>
        </div>

        {/* Modal de Demostración */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirmar Acción de Prueba"
          closeOnEsc={true}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setIsModalOpen(false); toast.success('Confirmado correctamente'); }}>
                Confirmar
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-slate-700 dark:text-slate-300">Este es el componente modal adaptado exactamente al proyecto de capacitaciones.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 text-xs">
              <li>Estructura con cabecera fija, scroll interno y pie de página</li>
              <li>Estilo visual minimalista, con bordes redondeados y fondos integrados</li>
              <li>Fondo semitransparente con desenfoque de fondo (backdrop blur)</li>
            </ul>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
