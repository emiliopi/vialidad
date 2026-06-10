import React from 'react';

export const Alert = ({
  children,
  type = 'info',
  title,
  className = '',
  ...props
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300',
      icon: 'M11.25 11.25l.041-.02a.75.75 0 111.063 1.06l-.041.02a.75.75 0 01-1.063-1.06zm0-3.75l.041-.02a.75.75 0 111.063 1.06l-.041.02a.75.75 0 01-1.063-1.06zm-6 3.75a9 9 0 1118 0 9 9 0 01-18 0z'
    },
    success: {
      container: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 01-18 0z'
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300',
      icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
    },
    danger: {
      container: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300',
      icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 01-18 0z'
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div
      className={`
        flex items-start gap-3.5 p-4 border rounded-2xl shadow-sm text-sm
        animate-in fade-in duration-200
        ${currentStyle.container}
        ${className}
      `}
      {...props}
    >
      {/* Icono de advertencia o información */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        className="w-5 h-5 shrink-0 mt-0.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={currentStyle.icon} />
      </svg>
      <div className="space-y-1">
        {title && <h5 className="font-bold text-sm leading-none">{title}</h5>}
        <div className="leading-relaxed text-xs opacity-90">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
