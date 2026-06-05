const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg', xl: 'w-16 h-16 text-xl' };

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : n.substring(0, 2).toUpperCase();
  };

  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;

  return (
    <div className={`${sizes[size]} rounded-full bg-primary flex items-center justify-center ${className}`}>
      <span className="text-white font-medium">{getInitials(name)}</span>
    </div>
  );
};

export default Avatar;
