import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/authService';
import Button from '../components/Common/Button';

const EyeIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.25 10.25 0 01-1.443 4.778m-7.592 7.592l-2.586 2.586a1 1 0 01-1.414 0l-2.585-2.586a1 1 0 010-1.414z" />
  </svg>
);

const Register = () => {
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const password = watch('password', '');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerApi({
        username: data.username,
        email: data.email,
        password: data.password,
        // codigo_rol omitido: el servidor siempre asigna el rol de menor privilegio
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              Crear Cuenta
            </h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base">Regístrate para acceder al sistema</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                {...register('username', {
                  required: 'El usuario es requerido',
                  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                })}
                className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors?.username 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                }`}
                placeholder="Usuario"
              />
              {errors?.username && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors?.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {errors?.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d).{6,}$/,
                      message: 'Debe tener mayúscula y número'
                    }
                  })}
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors?.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors?.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Confirma tu contraseña',
                    validate: (value) => 
                      value === password || 'Las contraseñas no coinciden'
                  })}
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors?.confirmPassword 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors?.confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>


            <Button type="submit" loading={loading} className="w-full py-3.5 text-base">
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 md:mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link 
                to="/login" 
                className="text-primary font-medium hover:text-primary-light transition-colors duration-300"
              >
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
