import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/Common';
import { APP_CONFIG } from '../config/constants';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: localStorage.getItem('remember_me') === 'true' ? localStorage.getItem('saved_email') || '' : ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('remember_me') === 'true');
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    const blockedUntil = localStorage.getItem('blocked_until');
    if (blockedUntil) {
      const remaining = parseInt(blockedUntil) - Date.now();
      if (remaining > 0) {
        setIsBlocked(true);
        setError(`Usuario bloqueado. Intenta de nuevo en ${Math.ceil(remaining / 1000)} segundos.`);
        
        const timer = setInterval(() => {
          const now = Date.now();
          const newRemaining = parseInt(blockedUntil) - now;
          
          if (newRemaining <= 0) {
            setError('');
            setIsBlocked(false);
            localStorage.removeItem('blocked_until');
            clearInterval(timer);
          } else {
            setError(`Usuario bloqueado. Intenta de nuevo en ${Math.ceil(newRemaining / 1000)} segundos.`);
          }
        }, 1000);

        return () => clearInterval(timer);
      } else {
        localStorage.removeItem('blocked_until');
      }
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('saved_email', data.email);
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('saved_email');
      }
      
      // Redirigir a la página principal del boilerplate
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || 'Error al iniciar sesión';

      // Si la cuenta está bloqueada, el backend incluye el tiempo en el mensaje.
      // Usamos el status 403 como señal de bloqueo activo.
      if (err.response?.status === 403) {
        // Intentar extraer los minutos del mensaje del backend, o usar 5 por defecto
        const match = errorMessage.match(/(\d+)\s*minuto/i);
        const lockoutMinutes = match ? parseInt(match[1]) : 5;
        const lockoutMs = lockoutMinutes * 60 * 1000;
        localStorage.setItem('blocked_until', String(Date.now() + lockoutMs));
        setIsBlocked(true);
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
          <div className="text-center mb-6 md:mb-8">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-28 mx-auto mb-4 object-contain" 
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              {APP_CONFIG.name}
            </h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base">Ingresa tus credenciales</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
            <Input
              label="Correo Electrónico"
              type="email"
              register={register('email', {
                required: 'El correo electrónico es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo electrónico inválido'
                }
              })}
              error={errors.email}
              placeholder="correo@ejemplo.com"
            />
            
            <Input
              label="Contraseña"
              type="password"
              register={register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              error={errors.password}
              placeholder="••••••••"
            />

            <Button type="submit" loading={loading} disabled={isBlocked} className="w-full py-3.5 md:py-4 text-base">
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
