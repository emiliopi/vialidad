import { useState } from 'react';

const Input = ({ label, type = "text", error, register, className = "", showCount, maxLength, readOnly, disabled, placeholder, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Manejo seguro del mensaje de error
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const hasError = !!errorMessage;

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          type={inputType} 
          {...register} 
          {...props} 
          placeholder={placeholder} 
          readOnly={readOnly} 
          disabled={disabled} 
          maxLength={maxLength}
          autoComplete="off"
          className={`
            w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-300 
            focus:outline-none focus:ring-2 focus:ring-primary/50
            bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
            ${hasError 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-slate-200 dark:border-slate-700 focus:border-primary'
            }
            ${readOnly ? 'bg-slate-100 dark:bg-slate-900 cursor-not-allowed' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isPassword ? 'pr-11' : ''}
          `} 
        />
        
        {isPassword && !readOnly && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 transition-colors focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.059 10.059 0 014.593-5.59m4.673-.547a3 3 0 00-4.636 4.636m1.892-1.892L12 12m0 0l2.122 2.122m-2.122-2.122l2.122-2.122m-2.122 2.122l-2.122 2.122M15.364 5.636a9.976 9.976 0 013.178 3.178m.547 4.673c-.116.416-.254.814-.413 1.192m-2.522 2.522a9.97 9.97 0 01-3.178 3.178" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hasError && <p className="mt-1.5 text-sm text-red-500">{errorMessage}</p>}
    </div>
  );
};

export default Input;
