import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', closeOnOutsideClick = false, closeOnEsc = false, className = '' }) => {
  const modalRef = useRef(null);
  
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-4xl' };

  useEffect(() => {
    const handleEsc = (e) => { if (closeOnEsc && e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEsc, onClose]);

  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto p-4 ${className}`} onClick={handleOutsideClick}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative min-h-full flex items-center justify-center">
        <div ref={modalRef} className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full ${sizes[size]} flex flex-col max-h-[90vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">{children}</div>
          {footer && <div className="flex gap-2 px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default Modal;
