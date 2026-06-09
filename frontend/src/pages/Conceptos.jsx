import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input, Modal, Badge, Skeleton, Switch } from '../components/Common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { conceptoService } from '../api/conceptoService';

export const Conceptos = () => {
  const { user: currentUser } = useAuth();
  
  // Estados para datos y carga
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  // Estados de paginación y búsqueda
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState(null);

  // Inicialización de react-hook-form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '',
      activo: true
    }
  });

  const watchActivo = watch('activo');

  // Carga de conceptos paginados server-side
  const fetchConceptos = async () => {
    setLoading(true);
    try {
      const data = await conceptoService.getConceptos(page, limit, search);
      setConceptos(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la lista de conceptos.');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para buscar y paginar
  useEffect(() => {
    fetchConceptos();
  }, [page, limit, search]);

  // Abrir modal en modo creación
  const handleOpenCreateModal = () => {
    setEditingConcepto(null);
    reset({
      nombre: '',
      activo: true
    });
    setIsModalOpen(true);
  };

  // Abrir modal en modo edición
  const handleOpenEditModal = (concepto) => {
    setEditingConcepto(concepto);
    reset({
      nombre: concepto.nombre,
      activo: concepto.activo
    });
    setIsModalOpen(true);
  };

  // Enviar el formulario (Crear / Editar)
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        activo: data.activo
      };

      if (editingConcepto) {
        // Modo Edición
        await conceptoService.updateConcepto(editingConcepto.codigo_concepto, payload);
        toast.success('¡Concepto actualizado correctamente!');
      } else {
        // Modo Creación
        await conceptoService.createConcepto(payload);
        toast.success('¡Concepto registrado correctamente!');
      }
      setIsModalOpen(false);
      fetchConceptos();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al guardar los cambios.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar concepto
  const handleDeleteConcepto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el concepto "${nombre}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await conceptoService.deleteConcepto(id);
      toast.success('Concepto eliminado exitosamente.');
      fetchConceptos();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al intentar eliminar el concepto.';
      toast.error(errMsg);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Control de acceso para administradores/operadores
  const hasAccess = currentUser?.menus?.some(m => m.path === '/conceptos') || currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center max-w-xl mx-auto my-12">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Acceso Restringido</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            No tienes los privilegios necesarios para visualizar esta sección. Por favor, contacta al administrador del sistema.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Cálculo de páginas
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Cabecera de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              Catálogo de Conceptos
              <Badge variant="primary">Configuración</Badge>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Administra los conceptos y motivos utilizados para la emisión de vialidades en el sistema.
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreateModal} className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Concepto
          </Button>
        </div>

        {/* Buscador Server-Side */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar conceptos por nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reiniciar paginación al filtrar
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Listado y Tabla */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <Skeleton variant="table" count={5} />
            </div>
          ) : conceptos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.043 9.043 0 005.62-1.954M12 21a9.043 9.043 0 01-5.62-1.954M12 21V10.5m0 10.5a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
              <p className="text-sm font-semibold">No se encontraron conceptos</p>
              <p className="text-xs text-slate-400 mt-1">Prueba a realizar otra búsqueda o registra un nuevo concepto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Nombre del Concepto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Fecha Creación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {conceptos.map((c) => (
                    <tr key={c.codigo_concepto} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        #{c.codigo_concepto}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {c.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={c.activo ? 'success' : 'danger'}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(c.fecha_creacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(c)} className="p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deleteLoading === c.codigo_concepto}
                            loading={deleteLoading === c.codigo_concepto}
                            onClick={() => handleDeleteConcepto(c.codigo_concepto, c.nombre)}
                            className="p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginador */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando página {page} de {totalPages} ({total} conceptos en total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Crear / Editar Concepto */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingConcepto ? 'Editar Concepto' : 'Nuevo Concepto'}
          footer={
            <div className="flex justify-end gap-2.5 w-full">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} size="sm">
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={submitting} size="sm">
                {editingConcepto ? 'Actualizar Concepto' : 'Registrar Concepto'}
              </Button>
            </div>
          }
        >
          <form className="space-y-4 pb-16" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Nombre del Concepto"
              placeholder="Ej. TASA VIAL"
              register={register('nombre', {
                required: 'El nombre del concepto es obligatorio',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 255, message: 'Máximo 255 caracteres' }
              })}
              error={errors.nombre}
            />

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado Activo</span>
              <Switch
                checked={watchActivo}
                onChange={(e) => setValue('activo', e.target.checked)}
              />
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Conceptos;
