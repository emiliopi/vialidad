import React from 'react';
import Button from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores externo
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier interfaz de repuesto personalizada
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-lg text-center space-y-6 animate-in fade-in duration-300">
            {/* Icono de advertencia elegante */}
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Algo no salió como esperábamos</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                La aplicación detectó un problema inesperado en esta pantalla. Hemos registrado el incidente para solucionarlo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="secondary" onClick={this.handleGoBack}>
                Ir al Inicio
              </Button>
              <Button variant="primary" onClick={this.handleReload}>
                Recargar Pantalla
              </Button>
            </div>

            {/* Detalles técnicos plegables — solo en desarrollo */}
            {import.meta.env.DEV && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 flex items-center gap-1.5 focus:outline-none mx-auto"
                >
                  {this.state.showDetails ? 'Ocultar Detalles Técnicos' : 'Mostrar Detalles Técnicos'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className={`w-3.5 h-3.5 transform transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-40">
                    <p className="font-bold mb-1">Error: {this.state.error?.toString()}</p>
                    <p className="text-slate-500 dark:text-slate-500 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
