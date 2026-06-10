const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-primary/10 text-primary',
  };

  const sizes = { sm: 'px-2 py-1 text-xs', md: 'px-3 py-1.5 text-xs', lg: 'px-4 py-2 text-sm' };

  return (
    <span className={`inline-flex items-center font-medium rounded-xl ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
