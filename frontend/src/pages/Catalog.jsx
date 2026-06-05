import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input, Select, Modal, Badge, Checkbox, Avatar, Skeleton, Switch, Tooltip, Alert } from '../components/Common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { formatDUI, formatNIT, formatTelefono, validateDUI, validateNIT } from '../utils/validations';
import api from '../api/axios';

export const Catalog = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [checkboxVal, setCheckboxVal] = useState(false);
  const [selectVal, setSelectVal] = useState('');
  const [switchVal, setSwitchVal] = useState(false);

  // Estados para el cargador de archivos interactivo
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Formulario para validaciones interactivas
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      dui: '',
      nit: '',
      telefono: ''
    }
  });

  const watchDui = watch('dui');
  const watchNit = watch('nit');
  const watchTelefono = watch('telefono');

  const onFormSubmit = (data) => {
    toast.success('¡Validaciones del formulario correctas!');
  };

  // Lógica de carga de archivos (Uploader seguro)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reiniciar estados
    setUploadError('');
    setUploadedFile(null);
    setUploadProgress(0);

    // 1. Validaciones en Frontend (Estándar de Seguridad)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      const errMsg = 'Tipo de archivo no permitido. Solo JPEG, PNG, WEBP y PDF.';
      setUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errMsg = 'El archivo supera el tamaño máximo permitido (5MB).';
      setUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    setUploading(true);

    // Verificar si el usuario está autenticado (tiene token)
    const token = localStorage.getItem('token');

    if (token) {
      // Subida REAL al backend a través de Axios
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post('/utils/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        
        setUploadedFile({
          name: file.name,
          url: `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000'}${response.data.url}`,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          type: file.type
        });
        toast.success('¡Archivo subido con éxito al servidor!');
      } catch (err) {
        console.error('Error al subir archivo:', err);
        const backendError = err.response?.data?.detail || err.response?.data?.error || 'Error al conectar con el servidor.';
        setUploadError(backendError);
        toast.error(backendError);
      } finally {
        setUploading(false);
      }
    } else {
      // Subida SIMULADA para demostración estética sin sesión iniciada
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploadedFile({
            name: file.name,
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type,
            simulated: true
          });
          setUploading(false);
          toast.success('¡Archivo subido exitosamente (Modo Simulado)!');
        }
      }, 150);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Catálogo de Componentes Base
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Demostración visual, estados, validaciones e interactividad de los componentes reutilizados del proyecto Capacitaciones.
          </p>
        </div>

        {/* Banner de Filosofía: Hecho desde Cero */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-start animate-in fade-in duration-300">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Filosofía de UI: Componentes hechos a medida y desde cero</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Esta plantilla base no depende de librerías gigantescas e infladas de UI de terceros (como Material UI, Bootstrap o Semantic UI) que sobrecargan el bundle de la aplicación. Todos los componentes de este catálogo han sido creados <strong>100% a mano</strong> utilizando variables <strong>CSS estándar y clases Tailwind CSS</strong>. 
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              Beneficios: Cero peso adicional en carga, adaptabilidad de estilos indestructible, responsive impecable y reutilización extrema mediante Props de React.
            </p>
          </div>
        </div>

        {/* 1. SECCIÓN BUTTONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Componente: Button
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Variantes y estados del componente botón:</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" loading={btnLoading} onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 2000);
              }}>
                Hacer Click para Cargar
              </Button>
              <Button variant="primary" disabled={true}>Disabled</Button>
            </div>
          </div>
        </div>

        {/* 2. SECCIÓN BADGES Y AVATARS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Badges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
              Componente: Badge
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="success" size="sm">Small Badge</Badge>
              <Badge variant="success" size="md">Medium Badge</Badge>
              <Badge variant="success" size="lg">Large Badge</Badge>
            </div>
          </div>

          {/* Avatars */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
              Componente: Avatar
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar name="Super Admin" size="xs" />
              <Avatar name="Super Admin" size="sm" />
              <Avatar name="Super Admin" size="md" />
              <Avatar name="Super Admin" size="lg" />
              <Avatar name="Super Admin" size="xl" />
            </div>
            <p className="text-xs text-slate-400">Genera automáticamente las iniciales si no se proporciona una imagen.</p>
          </div>
        </div>

        {/* 3. SECCIÓN INPUTS Y SELECTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Componentes: Input, Select & Checkbox
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Campo de Texto Estándar"
                placeholder="Escribe algo..."
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="Introduce tu contraseña..."
              />
              <Select
                label="Selector con Buscador"
                options={[
                  { value: '1', label: 'Opción Uno' },
                  { value: '2', label: 'Opción Dos' },
                  { value: '3', label: 'Opción Tres' },
                ]}
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                placeholder="Selecciona una opción..."
              />
            </div>
            <div className="space-y-6 pt-4">
              <div>
                <Checkbox
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                  label="Checkbox Personalizado Interactivo"
                />
                <p className="text-xs text-slate-400 mt-1.5 ml-7">Estado actual: {checkboxVal ? 'Marcado' : 'Desmarcado'}</p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  Abrir Modal Base de Capacitaciones
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN SKELETON LOADERS (NUEVO) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Componente: Skeleton Loader (UX Cargas Animadas)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Variantes estándar (Texto y Rectángulos):</p>
              <div className="space-y-2.5">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" count={3} />
                <Skeleton variant="rect" height="64px" />
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Simulación de perfil de usuario en carga:</p>
              <div className="flex gap-4 items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <Skeleton variant="circle" width="48px" height="48px" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width="40%" height="16px" />
                  <Skeleton variant="text" width="70%" height="12px" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Simulación de tabla de base de datos cargando:</p>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                <Skeleton variant="table" count={3} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. SECCIÓN CARGADOR DE ARCHIVOS SEGURO (NUEVO) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Componente: Cargador Seguro de Archivos (Uploader)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sube un archivo. Se validará un tamaño máximo de 5MB y tipos de archivo específicos (JPEG, PNG, WEBP, PDF) en frontend y backend:
          </p>

          <div className="max-w-xl mx-auto space-y-4">
            {/* Zona de Drop / Selección */}
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              />
              
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <label htmlFor="file-upload" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer">
                    Haz click para subir un archivo
                  </label>
                  <p className="text-xs text-slate-400 mt-1">o arrastra y suelta aquí</p>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">PDF, PNG, JPG, JPEG o WEBP (Máx. 5 MB)</p>
              </div>
            </div>

            {/* Barra de Progreso */}
            {uploading && (
              <div className="space-y-1.5 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm animate-in fade-in duration-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Subiendo archivo...</span>
                  <span className="font-semibold text-indigo-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mensajes de Error */}
            {uploadError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}

            {/* Vista Previa de Archivo Subido */}
            {uploadedFile && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3.5 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-950 dark:text-white truncate max-w-xs">{uploadedFile.name}</h4>
                    <p className="text-[10px] text-slate-400">{uploadedFile.size} • {uploadedFile.simulated ? 'Subida Simulada' : 'Guardado en Servidor'}</p>
                  </div>
                  <Badge variant={uploadedFile.simulated ? 'warning' : 'success'}>
                    {uploadedFile.simulated ? 'Demostración' : 'Completado'}
                  </Badge>
                </div>
                
                {uploadedFile.url ? (
                  <div className="max-w-xs mx-auto border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 p-1">
                    <img
                      src={uploadedFile.url}
                      alt="Vista previa"
                      className="w-full h-auto max-h-48 object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="p-2 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Archivo no visualizable (PDF o similar)</p>
                      {uploadedFile.url && (
                        <a
                          href={uploadedFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Ver documento original
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* NUEVOS COMPONENTES: SWITCH, TOOLTIP Y ALERT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Nuevos Componentes: Switch, Tooltip & Alert
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Switch & Tooltips */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Componente: Switch (Interruptor premium)</h4>
                <div className="flex flex-col gap-3">
                  <Switch
                    checked={switchVal}
                    onChange={(e) => setSwitchVal(e.target.checked)}
                    label={`Switch Interactivo (${switchVal ? 'Activo' : 'Inactivo'})`}
                  />
                  <Switch
                    checked={true}
                    disabled={true}
                    label="Switch Activo e Inhabilitado"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Componente: Tooltip (Información flotante)</h4>
                <p className="text-xs text-slate-500">Pasa el cursor sobre los botones para ver los tooltips en diferentes posiciones:</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <Tooltip content="Tooltip Superior (Top)" position="top">
                    <Button variant="outline" size="sm">Top</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip Inferior (Bottom)" position="bottom">
                    <Button variant="outline" size="sm">Bottom</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip Izquierdo (Left)" position="left">
                    <Button variant="outline" size="sm">Left</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip Derecho (Right)" position="right">
                    <Button variant="outline" size="sm">Right</Button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Componente: Alert (Notificaciones estáticas)</h4>
              <div className="space-y-3">
                <Alert type="success" title="Operación Exitosa">
                  El registro ha sido almacenado en SQL Server de forma correcta.
                </Alert>
                <Alert type="warning" title="Atención requerida">
                  Recuerda validar el DUI con el algoritmo oficial antes de proceder.
                </Alert>
                <Alert type="danger" title="Error crítico">
                  No se pudo establecer conexión con el servidor. Intenta nuevamente.
                </Alert>
              </div>
            </div>
          </div>
        </div>

        {/* 6. VALIDACIONES DE EL SALVADOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700">
            Validaciones y Formateadores en Tiempo Real (El Salvador)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prueba a escribir en los campos para verificar el formateo de guiones en tiempo real y la validación algorítmica:
          </p>

          <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DUI */}
            <div>
              <Input
                label="DUI (00000000-0)"
                placeholder="00000000-0"
                value={watchDui}
                onChange={(e) => setValue('dui', formatDUI(e.target.value), { shouldValidate: true })}
                register={register('dui', {
                  required: 'DUI es obligatorio',
                  validate: (val) => validateDUI(val) || 'DUI inválido (algoritmo oficial)'
                })}
                error={errors.dui}
              />
              {watchDui && validateDUI(watchDui) && (
                <span className="text-xs text-green-600 font-semibold mt-1 inline-block">✓ DUI Algorítmicamente Válido</span>
              )}
            </div>

            {/* NIT */}
            <div>
              <Input
                label="NIT (0000-000000-000-0)"
                placeholder="0000-000000-000-0"
                value={watchNit}
                onChange={(e) => setValue('nit', formatNIT(e.target.value), { shouldValidate: true })}
                register={register('nit', {
                  required: 'NIT es obligatorio',
                  validate: (val) => validateNIT(val) || 'NIT inválido (algoritmo oficial)'
                })}
                error={errors.nit}
              />
              {watchNit && validateNIT(watchNit) && (
                <span className="text-xs text-green-600 font-semibold mt-1 inline-block">✓ NIT Algorítmicamente Válido</span>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <Input
                label="Teléfono (+503 0000 0000)"
                placeholder="+503 0000 0000"
                value={watchTelefono}
                onChange={(e) => setValue('telefono', formatTelefono(e.target.value), { shouldValidate: true })}
                register={register('telefono', {
                  required: 'Teléfono es obligatorio',
                  minLength: { value: 13, message: 'Formato incompleto' }
                })}
                error={errors.telefono}
              />
            </div>

            <div className="md:col-span-3 pt-2">
              <Button type="submit" variant="primary">
                Enviar Formulario Validador
              </Button>
            </div>
          </form>
        </div>

        {/* Modal de Demostración */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Modal del Catálogo de Componentes"
          closeOnEsc={true}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cerrar
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setIsModalOpen(false); toast.success('Operación exitosa'); }}>
                Aceptar
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>Este es el componente modal en su versión exacta y limpia:</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>Mantiene el bloqueo del scroll de fondo (`overflow: hidden`).</li>
              <li>Reacciona al presionar la tecla `Escape` si la opción `closeOnEsc` está activa.</li>
              <li>Encapsulado con cabecera y pie de página alineados horizontalmente.</li>
            </ol>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Catalog;
