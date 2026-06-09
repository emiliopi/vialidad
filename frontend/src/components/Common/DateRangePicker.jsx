import React, { useState, useEffect, useRef } from 'react';

const DateRangePicker = ({ startDate, endDate, onChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  
  // Mes y Año que se muestran en el calendario interactivo
  const [viewDate, setViewDate] = useState(new Date());
  
  const containerRef = useRef(null);

  // Sincronizar estado local si las props cambian externamente
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Descartar cambios no aplicados al cerrar
        setTempStartDate(startDate);
        setTempEndDate(endDate);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [startDate, endDate]);

  const setPreset = (days) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    
    setTempStartDate(startStr);
    setTempEndDate(endStr);
    onChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (!tempStartDate || !tempEndDate) {
      return;
    }
    onChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleDayClick = (dateStr) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Si no hay fecha de inicio o ambas ya están seleccionadas, iniciamos un nuevo rango
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else {
      // Si ya hay fecha de inicio pero no de fin, establecemos la de fin
      const start = new Date(tempStartDate);
      const clicked = new Date(dateStr);
      
      if (clicked < start) {
        // Si la clickeada es anterior, la volvemos la nueva fecha de inicio
        setTempStartDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  // Lógica para renderizar el calendario de un mes específico
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const totalDays = getDaysInMonth(year, month);
    
    const days = [];
    
    // Rellenar días del mes anterior vacíos
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Rellenar días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      days.push(`${yearStr}-${monthStr}-${dayStr}`);
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getDayClass = (dateStr) => {
    if (!dateStr) return 'invisible';
    
    const isStart = tempStartDate === dateStr;
    const isEnd = tempEndDate === dateStr;
    
    if (isStart && isEnd) {
      return 'bg-primary text-white rounded-lg font-bold scale-105';
    }
    if (isStart) {
      return 'bg-primary text-white rounded-l-lg font-bold rounded-r-none';
    }
    if (isEnd) {
      return 'bg-primary text-white rounded-r-lg font-bold rounded-l-none';
    }
    
    if (tempStartDate && tempEndDate) {
      const current = new Date(dateStr);
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      if (current > start && current < end) {
        return 'bg-primary/10 text-primary dark:text-sky-350 dark:bg-primary/20 rounded-none';
      }
    }
    
    // Día actual
    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr === dateStr) {
      return 'border border-primary text-primary dark:text-sky-400 font-semibold rounded-lg';
    }
    
    return 'text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg';
  };

  const getPresetLabel = () => {
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 30) return 'Últimos 30 días';
    if (diffDays === 7) return 'Últimos 7 días';
    if (diffDays === 1) return 'Ayer / Hoy';
    return 'Rango Personalizado';
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarDays = generateCalendarDays();

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary transition-all duration-300 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-primary dark:text-sky-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
        <span>{getPresetLabel()}: {startDate} al {endDate}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[350px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-250">
          
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            Rango de Fechas
          </h4>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPreset(1)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              Últimas 24h
            </button>
            <button
              onClick={() => setPreset(7)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              Últimos 30 días
            </button>
          </div>

          {/* Calendario con Diseño Propio */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
              <span>Do</span>
              <span>Lu</span>
              <span>Ma</span>
              <span>Mi</span>
              <span>Ju</span>
              <span>Vi</span>
              <span>Sa</span>
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateStr, index) => {
                const dayNum = dateStr ? parseInt(dateStr.split('-')[2], 10) : '';
                return (
                  <button
                    key={index}
                    disabled={!dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`h-8 text-[11px] flex items-center justify-center transition-all cursor-pointer ${getDayClass(dateStr)}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rango Seleccionado Actual en el Panel */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Rango:</span>
            <span className="text-primary dark:text-sky-400 font-bold">
              {tempStartDate ? tempStartDate : 'Inicio'} a {tempEndDate ? tempEndDate : 'Fin'}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
            >
              Restablecer
            </button>
            <button
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="px-4 py-2 bg-primary disabled:opacity-50 text-white rounded-xl text-[10px] font-bold shadow-md hover:bg-primary-light transition-all cursor-pointer"
            >
              Aplicar Rango
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
