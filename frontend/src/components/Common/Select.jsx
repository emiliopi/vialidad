import { useState, useRef, useEffect } from 'react';

const Select = ({ label, options = [], value, onChange, placeholder = "Seleccionar...", disabled, className = "", searchable = true, error, showError = false, name = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const filteredOptions = search 
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <input type="hidden" name={name} value={value} />
      <button
        id={name}
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(''); }}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 rounded-xl appearance-none cursor-pointer
          bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
          border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
          ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}
          flex items-center justify-between
        `}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 right-0 mt-1.5 z-[9999] bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-y-auto"
          style={{ 
            maxHeight: '12rem'
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="Buscar..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary"
              />
            </div>
          )}
          <div>
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={() => { onChange({ target: { value: option.value } }); setIsOpen(false); setSearch(''); }}
                className={`
                  w-full px-3 py-2 text-left transition-colors
                  ${option.value === value 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-slate-400 text-center">No se encontraron resultados</div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
