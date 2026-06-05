import React from 'react';

export const Tooltip = ({
  children,
  content,
  position = 'top',
  className = ''
}) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800'
  };

  return (
    <div className={`relative flex items-center group w-fit ${className}`}>
      {children}
      {content && (
        <div
          className={`
            absolute hidden group-hover:flex flex-col items-center z-50
            animate-in fade-in zoom-in-95 duration-200
            ${positions[position]}
          `}
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap relative">
            {content}
            {/* Flecha indicativa */}
            <div className={`absolute border-4 border-transparent ${arrows[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
