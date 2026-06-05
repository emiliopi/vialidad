import React from 'react';

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  // Generar clases base de animación de pulsación/shimmer
  const baseClasses = 'bg-slate-200 dark:bg-slate-800 animate-pulse rounded';

  // Configuración de estilos en base a la variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'rect':
        return 'rounded-lg';
      case 'table':
        return 'w-full h-8 rounded';
      case 'text':
      default:
        return 'h-4 w-full rounded';
    }
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  // Generar múltiples instancias si count > 1
  const elements = Array.from({ length: count });

  if (variant === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Fila de cabecera ficticia */}
        <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 animate-pulse rounded" />
        </div>
        {/* Filas de la tabla */}
        {elements.map((_, index) => (
          <div key={index} className="flex gap-4 items-center py-2.5 border-b border-slate-50 dark:border-slate-900/50">
            <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {elements.map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${getVariantClasses()} ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

export default Skeleton;
