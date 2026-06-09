import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common';
import { permisosService } from '../api/permisosService';

export const Permisos = () => {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [allowedMenuIds, setAllowedMenuIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [rolesData, menusData] = await Promise.all([
        permisosService.getRoles(),
        permisosService.getMenus()
      ]);
      setRoles(rolesData);
      setMenus(menusData);
      
      if (rolesData.length > 0) {
        // Seleccionar por defecto el primer rol que no sea Super Admin para seguridad, o Super Admin mismo
        setSelectedRol(rolesData[0]);
        await fetchRoleMenus(rolesData[0].codigo_rol);
      }
    } catch (err) {
      console.error('Error al cargar datos de permisos:', err);
      toast.error('No se pudieron cargar los roles o menús del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleMenus = async (roleId) => {
    try {
      const activeIds = await permisosService.getRoleMenus(roleId);
      setAllowedMenuIds(activeIds);
    } catch (err) {
      console.error('Error al obtener menús del rol:', err);
      toast.error('Error al cargar los permisos del rol seleccionado.');
    }
  };

  const handleSelectRol = async (rol) => {
    setSelectedRol(rol);
    await fetchRoleMenus(rol.codigo_rol);
  };

  const handleToggleMenu = (menuId) => {
    // Si es Super Admin, no permitimos remover su propio menú de Permisos o Usuarios para evitar bloqueos accidentales
    if (selectedRol?.nombre === 'Super Admin') {
      const menuObj = menus.find(m => m.codigo_menu === menuId);
      if (menuObj && (menuObj.path === '/permisos' || menuObj.path === '/usuarios')) {
        toast.error('No puedes remover accesos críticos (Permisos, Usuarios) del rol Super Admin.');
        return;
      }
    }

    setAllowedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSavePermisos = async () => {
    if (!selectedRol) return;
    setSaving(true);
    try {
      await permisosService.updateRoleMenus(selectedRol.codigo_rol, allowedMenuIds);
      toast.success(`Permisos de ${selectedRol.nombre} actualizados con éxito.`);
    } catch (err) {
      console.error('Error al guardar permisos:', err);
      toast.error('No se pudieron guardar los permisos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Encabezado */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Gestión de Permisos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Asigna qué pantallas y opciones de menú tiene permitido visualizar cada Rol del sistema.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando roles y privilegios del sistema...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Panel de Roles (Izquierda) */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
                Roles del Sistema
              </h3>
              
              <div className="space-y-2">
                {roles.map((rol) => (
                  <button
                    key={rol.codigo_rol}
                    onClick={() => handleSelectRol(rol)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-between group ${
                      selectedRol?.codigo_rol === rol.codigo_rol
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{rol.nombre}</span>
                    <svg
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        selectedRol?.codigo_rol === rol.codigo_rol ? 'text-white' : 'text-slate-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel de Permisos / Checkboxes (Derecha) */}
            <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Menús Permitidos para {selectedRol?.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Habilita o deshabilita los accesos de la barra lateral.</p>
                </div>
                
                <Button
                  onClick={handleSavePermisos}
                  variant="primary"
                  className="shadow-md"
                  disabled={saving || !selectedRol}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menus.map((menu) => {
                  const isChecked = allowedMenuIds.includes(menu.codigo_menu);
                  return (
                    <div
                      key={menu.codigo_menu}
                      onClick={() => handleToggleMenu(menu.codigo_menu)}
                      className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer select-none ${
                        isChecked
                          ? 'border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/50'
                      }`}
                    >
                      <div className="space-y-0.5 text-left">
                        <p className="font-semibold text-slate-850 dark:text-slate-200 text-sm">
                          {menu.label}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {menu.path}
                        </p>
                      </div>
                      
                      {/* Custom Switch / Checkbox */}
                      <div className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        isChecked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          isChecked ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Permisos;
