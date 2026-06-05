const Checkbox = ({ checked, onChange, disabled, label, className = '' }) => (
  <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${checked ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-800 border-slate-300 hover:border-primary'}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="w-0 h-0 opacity-0 absolute" />
      {checked && <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
    </div>
    {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
  </label>
);

export default Checkbox;
