import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input, Select, Modal, Badge, Skeleton } from '../components/Common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../api/userService';

export const Usuarios = () => {
  const { user: currentUser } = useAuth();
  
  // Estados para datos y carga
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
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
  const [editingUser, setEditingUser] = useState(null);

  // Inicialización de react-hook-form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      usuario: '',
      email: '',
      password: '',
      codigo_rol: ''
    }
  });

  // Carga de usuarios paginados server-side
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(page, limit, search);
      let list = data.items || [];
      if (currentUser?.role !== 'Super Admin') {
        list = list.filter(u => u.codigo_rol !== 1 && u.rol?.nombre !== 'Super Admin');
      }
      setUsers(list);
      setTotal(currentUser?.role !== 'Super Admin' ? list.length : (data.total || 0));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // Carga de roles para el selector
  const fetchRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los roles del sistema.');
    }
  };

  // Efecto para buscar y paginar
  useEffect(() => {
    fetchUsers();
  }, [page, limit, search]);

  // Efecto de carga inicial
  useEffect(() => {
    fetchRoles();
  }, []);

  // Abrir modal en modo creación
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    reset({
      usuario: '',
      email: '',
      password: '',
      codigo_rol: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal en modo edición
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    reset({
      usuario: user.usuario,
      email: user.email,
      password: '', // Vacío por defecto al editar
      codigo_rol: String(user.codigo_rol)
    });
    setIsModalOpen(true);
  };

  // Enviar el formulario (Crear / Editar)
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        usuario: data.usuario,
        email: data.email,
        codigo_rol: parseInt(data.codigo_rol, 10),
      };
      
      // Solo agregamos contraseña si fue ingresada (necesario al crear o si se quiere cambiar en edición)
      if (data.password) {
        payload.password = data.password;
      }

      if (editingUser) {
        // Modo Edición
        await userService.updateUser(editingUser.codigo_usuario, payload);
        toast.success('¡Usuario actualizado correctamente!');
      } else {
        // Modo Creación (Contraseña es obligatoria)
        if (!data.password) {
          toast.error('La contraseña es obligatoria para nuevos usuarios.');
          setSubmitting(false);
          return;
        }
        await userService.createUser(payload);
        toast.success('¡Usuario registrado correctamente!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al guardar los cambios.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id, username) => {
    if (String(id) === String(currentUser?.id)) {
      toast.error('No puedes eliminar tu propia cuenta de usuario activo.');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${username}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await userService.deleteUser(id);
      toast.success('Usuario eliminado exitosamente.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al intentar eliminar el usuario.';
      toast.error(errMsg);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Limitar accesos (doble protección dinámica)
  const hasAccess = currentUser?.menus?.some(m => m.path === '/usuarios') || currentUser?.role === 'Super Admin';
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
              Gestión de Usuarios
              <Badge variant="primary">Panel Admin</Badge>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Crea, edita, busca y administra las cuentas de usuario y sus respectivos roles en la plataforma.
            </p>
          </div>
          {currentUser?.role === 'Super Admin' && (
            <Button variant="primary" onClick={handleOpenCreateModal} className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Usuario
            </Button>
          )}
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
              placeholder="Buscar usuarios por nombre o correo electrónico..."
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
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-sm font-semibold">No se encontraron usuarios</p>
              <p className="text-xs text-slate-400 mt-1">Prueba a realizar otra búsqueda o registra un nuevo usuario.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Correo Electrónico</th>
                    <th className="px-6 py-4">Rol Asignado</th>
                    <th className="px-6 py-4">Intentos de Login</th>
                    <th className="px-6 py-4">Fecha Creación</th>
                    {currentUser?.role === 'Super Admin' && <th className="px-6 py-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const isSelf = String(u.codigo_usuario) === String(currentUser?.id);
                    return (
                      <tr key={u.codigo_usuario} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {u.usuario.charAt(0)}
                          </div>
                          {u.usuario}
                          {isSelf && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-semibold">Tú</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={u.rol?.nombre === 'Super Admin' ? 'primary' : 'success'}>
                            {u.rol?.nombre || 'Usuario'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.intentos_login > 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'}`}>
                            {u.intentos_login}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(u.fecha_creacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        {currentUser?.role === 'Super Admin' && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(u)} className="p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isSelf || deleteLoading === u.codigo_usuario}
                                loading={deleteLoading === u.codigo_usuario}
                                onClick={() => handleDeleteUser(u.codigo_usuario, u.usuario)}
                                className="p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginador */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando página {page} de {totalPages} ({total} usuarios en total)
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

        {/* Modal de Crear / Editar Usuario */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          footer={
            <div className="flex justify-end gap-2.5 w-full">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} size="sm">
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={submitting} size="sm">
                {editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}
              </Button>
            </div>
          }
        >
          <form className="space-y-4 pb-32" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Nombre de Usuario"
              placeholder="Ej. juan.perez"
              register={register('usuario', {
                required: 'El nombre de usuario es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                maxLength: { value: 50, message: 'Máximo 50 caracteres' }
              })}
              error={errors.usuario}
            />

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="juan@gmail.com"
              register={register('email', {
                required: 'El correo electrónico es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo electrónico inválido'
                }
              })}
              error={errors.email}
            />

            <Input
              label={editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
              type="password"
              placeholder={editingUser ? 'Dejar en blanco para no modificar' : 'Mínimo 6 caracteres con Mayúscula y Número'}
              register={register('password', {
                required: !editingUser ? 'La contraseña es obligatoria' : false,
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                validate: (val) => {
                  if (editingUser && !val) return true; // Opcional en edición
                  if (!/[A-Z]/.test(val)) return 'Debe contener al menos una letra mayúscula.';
                  if (!/[0-9]/.test(val)) return 'Debe contener al menos un número.';
                  return true;
                }
              })}
              error={errors.password}
            />

            <Select
              label="Rol del Usuario"
              value={watch('codigo_rol')}
              onChange={(e) => setValue('codigo_rol', e.target.value, { shouldValidate: true })}
              options={[
                { value: '', label: 'Seleccionar rol...' },
                ...roles.map((r) => ({
                  value: String(r.codigo_rol),
                  label: r.nombre
                }))
              ]}
              register={register('codigo_rol', {
                required: 'El rol es obligatorio'
              })}
              error={errors.codigo_rol?.message}
            />
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
