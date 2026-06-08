import React from 'react';

export const VialidadDocument = ({ data }) => {
  // Obtener el año de la fecha actual para la expiración
  const currentYear = new Date().getFullYear();

  return (
    <div className="lg:col-span-8 flex justify-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
      {/* Boleto-Recibo de Papel Bond */}
      <div 
        id="print-area"
        className="bg-sky-50/50 text-sky-950 p-8 sm:p-12 w-[21cm] min-h-[16cm] flex flex-col justify-between font-sans border-2 border-sky-200 rounded-xl relative select-text shadow-xl print:shadow-none print:border-sky-600 print:bg-white"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Marca de agua de seguridad de fondo (simulada con CSS) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap justify-around items-center overflow-hidden p-4 select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="-rotate-12 text-xs font-bold uppercase tracking-widest text-sky-900 m-4">
              MINISTERIO DE HACIENDA
            </span>
          ))}
        </div>

        {/* Encabezado del Recibo */}
        <div className="relative z-10 border-b border-sky-200/50 pb-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5 text-left">
              <h2 className="text-[14px] font-bold tracking-wider uppercase text-sky-850">
                República de El Salvador
              </h2>
              <h1 className="text-[18px] font-black tracking-wide uppercase text-sky-950 font-display">
                Fondo de Vialidad
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Escudo El Salvador" className="w-9 h-9 object-contain print:contrast-125" />
              <div className="h-8 border-l border-sky-300/80 mx-1"></div>
              <div className="text-left leading-none">
                <p className="text-[7px] font-bold text-sky-800 uppercase">Ministerio de</p>
                <p className="text-[9px] font-black text-sky-950 uppercase font-display">Hacienda</p>
              </div>
            </div>
          </div>

          {/* Fila Inferior: Municipio/Distrito (Ancho completo) y debajo las 3 Columnas (Boleto-Recibo, No, Valor) */}
          <div className="space-y-3 pt-2">
            <div className="text-[13px] font-bold text-sky-700 flex items-end gap-2 w-full">
              <span className="shrink-0 leading-none">MUNICIPIO / DISTRITO:</span>
              <div className="flex-1 border-b-2 border-sky-300 text-slate-600 font-bold uppercase tracking-wide text-xs px-2 leading-none min-h-[16px] text-left">
                {data.distrito || '\u00A0'}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-[13px] font-bold tracking-widest text-sky-700 uppercase">
                BOLETO-RECIBO SERIE "C"
              </div>

              <div className="text-center">
                <div className="text-[13px] font-bold tracking-widest text-sky-700 uppercase">
                  Nº <span className="font-black text-red-600 text-base">178513</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[13px] font-bold tracking-widest text-sky-700 uppercase">
                  VALOR <span className="font-extrabold text-sky-700">$3.43</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo Principal (Recuadro con borde azul y esquinas redondeadas) */}
        <div className="relative z-10 my-6 border-2 border-sky-300 bg-white/80 dark:bg-white/90 p-6 rounded-2xl shadow-sm text-sky-800 text-sm sm:text-base leading-relaxed text-justify space-y-4">
          <div>
            <span className="font-bold text-sky-800 font-display">Contribuyente: </span>
            <strong className="inline-block min-w-[250px] text-base uppercase bg-sky-100/70 border-b-2 border-sky-300 px-3 py-0.5 rounded font-sans font-bold tracking-wide text-center text-slate-600">
              {data.solicitante || '\u00A0'}
            </strong>
          </div>

          <p className="indent-4 text-sky-800 font-medium leading-loose">
            ha pagado en este Distrito la suma de <strong className="text-sky-800 font-bold">TRES DOLARES CON CUARENTA Y TRES centavos</strong>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong className="inline-block min-w-[150px] text-base uppercase bg-sky-100/70 border-b-2 border-sky-300 px-3 py-0.5 rounded font-sans font-bold tracking-wide text-center text-slate-600">{data.concepto || '\u00A0'}</strong>. Durante el presente año.
          </p>
        </div>

        {/* Firmas y Fechas */}
        <div className="relative z-10 grid grid-cols-2 gap-6 border-t border-sky-200/30 pt-4 mt-auto">
          {/* Columna Izquierda: Emisión y Alcalde */}
          <div className="flex flex-col items-center justify-between text-center space-y-6">
            <div className="text-center font-sans space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-sky-600 font-bold">Fecha de Emisión</span>
              <p className="text-sm font-black text-sky-900 underline decoration-sky-300 decoration-2">
                {data.fecha || '____________________'}
              </p>
            </div>
            
            <div className="relative flex flex-col items-center pt-6">
              {/* Firma simulada elegante */}
              <div className="absolute -top-3 w-28 h-12 flex items-center justify-center opacity-70 select-none pointer-events-none">
                <svg className="w-full h-full text-blue-700/60" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M10 25c15-10 25-20 40-5s20-25 15 15c-5 10-15-5 5-20s20 5 15 10" />
                </svg>
              </div>
              <div className="w-40 h-[1.5px] bg-sky-800/60 mb-1"></div>
              <p className="text-[10px] font-black text-sky-900 uppercase">Alcalde o Delegado</p>
            </div>
          </div>

          {/* Columna Derecha: Expiración y Secretario */}
          <div className="flex flex-col items-center justify-between text-center space-y-6">
            <div className="text-center font-sans space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-sky-600 font-bold">Fecha de Expiración</span>
              <p className="text-sm font-black text-sky-900 underline decoration-sky-300 decoration-2">
                31 de diciembre de {currentYear}
              </p>
            </div>

            <div className="relative flex flex-col items-center pt-6">
              {/* Sello Oficial Circular superpuesto sutilmente en la firma */}
              <div className="absolute -top-8 -right-4 w-16 h-16 rounded-full border border-dashed border-blue-600/30 flex items-center justify-center rotate-12 opacity-60 pointer-events-none select-none">
                <div className="text-[5px] text-blue-600/50 font-bold text-center leading-none uppercase">
                  <span>Distrito</span>
                  <br />
                  <span>San Salvador</span>
                </div>
              </div>
              {/* Firma simulada elegante */}
              <div className="absolute -top-3 w-28 h-12 flex items-center justify-center opacity-70 select-none pointer-events-none">
                <svg className="w-full h-full text-blue-700/60" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 15c20 5 10 25 35 10s-5-30-20-10s25 10 30-15" />
                </svg>
              </div>
              <div className="w-40 h-[1.5px] bg-sky-800/60 mb-1"></div>
              <p className="text-[10px] font-black text-sky-900 uppercase">Secretario</p>
            </div>
          </div>
        </div>

        {/* Pie de Página */}
        <div className="relative z-10 text-[9px] font-semibold text-sky-700 text-center leading-tight mt-6 pt-3 border-t border-sky-200/20">
          Para empleados del Estado o Particulares, con sueldo de más de CIENTO CATORCE DÓLARES CON VEINTIOCHO CENTAVOS mensuales, en adelante.
        </div>
      </div>
    </div>
  );
};

export default VialidadDocument;
