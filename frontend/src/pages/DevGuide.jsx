import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Badge } from '../components/Common';
import { toast } from 'react-hot-toast';

export const DevGuide = () => {
  const [activeTab, setActiveTab] = useState('structure');
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`¡Código de ${label} copiado al portapapeles!`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const codeSnippets = {
    model: `from sqlalchemy import BigInteger, String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Producto(Base):
    __tablename__ = "PRODUCTOS"

    codigo_producto: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)`,
    
    schema: `from pydantic import BaseModel, Field

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    precio: float = Field(..., gt=0)

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(ProductoBase):
    activo: bool

class ProductoResponse(ProductoBase):
    codigo_producto: int
    activo: bool

    class Config:
        from_attributes = True`,

    service: `from app.services.base import CRUDBase
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate

class CRUDProducto(CRUDBase[Producto, ProductoCreate, ProductoUpdate]):
    pass

producto_service = CRUDProducto(Producto)`,

    endpoint: `from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.producto import ProductoResponse, ProductoCreate
from app.services.producto import producto_service

router = APIRouter()

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(producto_in: ProductoCreate, db: Session = Depends(deps.get_db)):
    return producto_service.create(db, obj_in=producto_in)`
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              Guía Visual para Desarrolladores
              <Badge variant="primary">Boilerplate v1.0</Badge>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manual dinámico de arquitectura y patrones de código para acelerar el desarrollo de nuevos módulos.
            </p>
          </div>
        </div>

        {/* Banner de Filosofía: Hecho a Mano y desde Cero */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-6 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3 bg-indigo-600 dark:bg-indigo-600/90 text-white rounded-2xl shrink-0 shadow-lg shadow-indigo-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a11.5 11.5 0 0012.454-9.354m0 0L21 3m0 0l-5.096.813m5.096-.813A11.5 11.5 0 005.051 7.75" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Filosofía de UI: Componentes 100% Hechos a Mano & Reutilizables
              <Badge variant="success">Sin Dependencias Externas</Badge>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Todos los componentes del directorio <code className="font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded">src/components/Common/</code> han sido programados **desde cero en React y Tailwind CSS**, sin utilizar pesadas librerías de terceros (como Material UI, Semantic o Bootstrap). Esto garantiza un **renderizado hiperveloz en milisegundos**, elimina el bloatware del bundle final y proporciona un control estético total y predecible.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Regla de oro:</strong> Cada componente expone interfaces (props) estándar limpias (<code className="font-mono">children</code>, <code className="font-mono">className</code>, <code className="font-mono">disabled</code>, <code className="font-mono">onChange</code>) para que sean completamente extensibles y adaptables a cualquier requerimiento en 5 minutos.
            </p>
          </div>
        </div>

        {/* Tabs de Navegación de la Guía */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('structure')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'structure'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Estructura de Carpetas
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'backend'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            2. Guía Backend (FastAPI)
          </button>
          <button
            onClick={() => setActiveTab('frontend')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'frontend'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            3. Guía Frontend (React)
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'rbac'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            4. Menús y Roles (RBAC)
          </button>
        </div>

        {/* CONTENIDOS DE TABS */}

        {/* Tab 1: Estructura de Carpetas */}
        {activeTab === 'structure' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Backend structure card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-7-4h.01M11 16h.01" />
                </svg>
                Backend: FastAPI
              </div>
              <p className="text-xs text-slate-500">¿Dónde va cada archivo de lógica?</p>
              <div className="space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">app/models/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Modelos físicos de la base de datos SQL Server (SQLAlchemy).</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">app/schemas/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Esquemas de validación de entradas y salidas de la API (Pydantic).</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">app/services/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Reglas de negocio y herencia del CRUD base genérico.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">app/api/v1/endpoints/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Controladores de las rutas del API protegidas por JWT.</p>
                </div>
              </div>
            </div>

            {/* Frontend structure card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Frontend: React
              </div>
              <p className="text-xs text-slate-500">¿Dónde colocar los componentes visuales?</p>
              <div className="space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">src/api/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Servicios de peticiones Axios e interceptores de auto-refresh.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">src/components/Common/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Componentes reutilizables (Button, Input, Skeletons, Modal).</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">src/pages/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Vistas y pantallas generales del Dashboard.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">src/utils/</span>
                  <p className="text-[10px] text-slate-400 mt-1">Formateadores y validaciones algorítmicas de DUI y NIT.</p>
                </div>
              </div>
            </div>

            {/* Architecture diagram card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Flujo de Datos Limpio
              </div>
              <p className="text-xs text-slate-500">Dirección de la arquitectura del software:</p>
              
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg font-semibold text-slate-800 dark:text-indigo-300">
                  <span>1. Frontend UI</span>
                  <span className="text-[10px] text-indigo-600 font-bold">VISTA</span>
                </div>
                <div className="text-center text-slate-400">↓ (Axios Call)</div>
                <div className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg font-semibold text-slate-800 dark:text-indigo-300">
                  <span>2. Endpoints (FastAPI)</span>
                  <span className="text-[10px] text-indigo-600 font-bold">CONTROLADOR</span>
                </div>
                <div className="text-center text-slate-400">↓ (Validation)</div>
                <div className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg font-semibold text-slate-800 dark:text-indigo-300">
                  <span>3. CRUD Base (Service)</span>
                  <span className="text-[10px] text-indigo-600 font-bold">NEGOCIO</span>
                </div>
                <div className="text-center text-slate-400">↓ (SQLAlchemy)</div>
                <div className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg font-semibold text-slate-800 dark:text-indigo-300">
                  <span>4. SQL Server</span>
                  <span className="text-[10px] text-indigo-600 font-bold">BASE DATOS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Backend Developer Guide */}
        {activeTab === 'backend' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Modelo Paso A */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">A</span>
                    Paso 1: Mapear la Tabla SQL Server (Model)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(codeSnippets.model, 'Modelo Python')}>
                    {copiedText === 'Modelo Python' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">backend/app/models/producto.py</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto max-h-56">{codeSnippets.model}</pre>
                </div>
              </div>

              {/* Esquema Paso B */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">B</span>
                    Paso 2: Definir Validación y Tipado (Schemas Pydantic)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(codeSnippets.schema, 'Esquemas Pydantic')}>
                    {copiedText === 'Esquemas Pydantic' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">backend/app/schemas/producto.py</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto max-h-56">{codeSnippets.schema}</pre>
                </div>
              </div>

              {/* Servicio Paso C */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">C</span>
                    Paso 3: Heredar del CRUD Genérico (Service)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(codeSnippets.service, 'Servicio Genérico')}>
                    {copiedText === 'Servicio Genérico' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">backend/app/services/producto.py</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto max-h-56">{codeSnippets.service}</pre>
                </div>
              </div>

              {/* Controlador Paso D */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">D</span>
                    Paso 4: Exponer el Endpoint con JWT (Controlador)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(codeSnippets.endpoint, 'Endpoint FastAPI')}>
                    {copiedText === 'Endpoint FastAPI' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">backend/app/api/v1/endpoints/productos.py</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto max-h-56">{codeSnippets.endpoint}</pre>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Frontend Developer Guide */}
        {activeTab === 'frontend' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Paso 1 Frontend: Axios */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Crear la API en Cliente Axios
                </h3>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">frontend/src/api/productoService.js</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto">
{`import api from './axios';

export const productoService = {
  getProductos: async () => {
    const res = await api.get('/productos');
    return res.data;
  },
  createProducto: async (data) => {
    const res = await api.post('/productos', data);
    return res.data;
  }
};`}
                  </pre>
                </div>
              </div>

              {/* Paso 2 Frontend: Vistas y Skeletons */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  Crear Pantalla con DashboardLayout y Skeletons de Carga
                </h3>
                <p className="text-xs text-slate-500 ml-8">
                  Crea tu archivo en <code className="font-mono text-indigo-600">frontend/src/pages/Productos.jsx</code> para la visualización del contenido.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto max-h-72">
{`import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input, Skeleton } from '../components/Common';
import { productoService } from '../api/productoService';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inicialización de react-hook-form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { nombre: '', precio: '' }
  });

  const fetchProductos = async () => {
    try {
      const data = await productoService.getProductos();
      setProductos(data);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Función de envío de formulario (Submit)
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await productoService.createProducto(data);
      toast.success('¡Producto registrado con éxito!');
      reset(); // Limpiar el formulario
      fetchProductos(); // Recargar el catálogo
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al guardar';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulario de Registro */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 h-fit space-y-4">
          <h2 className="text-base font-bold dark:text-white">Nuevo Producto</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre del Producto"
              placeholder="Ej. Teclado Mecánico"
              register={register('nombre', { required: 'El nombre es obligatorio' })}
              error={errors.nombre}
            />
            <Input
              label="Precio ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register('precio', { 
                required: 'El precio es obligatorio',
                min: { value: 0.01, message: 'Debe ser mayor a 0' }
              })}
              error={errors.precio}
            />
            <Button type="submit" variant="primary" loading={submitting} className="w-full">
              Guardar Producto
            </Button>
          </form>
        </div>

        {/* Listado de Consulta */}
        <div className="md:col-span-2">
          {loading ? (
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
              <Skeleton variant="table" count={3} />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-bold dark:text-white mb-4">Catálogo de Productos</h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {productos.map(p => (
                  <li key={p.codigo_producto} className="py-3 flex justify-between text-sm">
                    <span className="dark:text-slate-200">{p.nombre}</span>
                    <span className="font-bold text-indigo-600">\\\${p.precio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};`}
                  </pre>
                </div>
              </div>

              {/* Paso 3 Frontend: Rutas */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  Registrar la Ruta Protegida
                </h3>
                <p className="text-xs text-slate-500 ml-8">
                  Abre <code className="font-mono text-indigo-600">frontend/src/App.jsx</code> y añade la ruta:
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto">
{`<Route 
  path="/productos" 
  element={
    <ProtectedRoute>
      <Productos />
    </ProtectedRoute>
  } 
/>`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Roles y Menús (RBAC) */}
        {activeTab === 'rbac' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Cómo está constituido el menú */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Cómo está constituido el Menú Dinámico
                </h3>
                <p className="text-xs text-slate-500 ml-8">
                  El menú se define como una colección de objetos JSON. El frontend renderiza la barra lateral dinámicamente. Si el backend retorna una lista en <code className="font-mono text-indigo-600">user.menus</code>, se renderiza esa lista; de lo contrario, se despliega el menú por defecto en <code className="font-mono text-indigo-600">DashboardLayout.jsx</code>.
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto">
{`// Estructura de datos esperada para cada opción del menú:
{
  "label": "Empleados",
  "path": "/empleados",
  // Ruta SVG estándar de Heroicons
  "icon": "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0"
}`}
                  </pre>
                </div>
              </div>

              {/* Roles en el Frontend */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    Control de Visualización de Opciones en el Frontend (Roles)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(`{user?.role === 'SuperAdmin' && (
  <Button variant="primary">
    Configuraciones de Sistema
  </Button>
)}`, 'Frontend RBAC')}>
                    {copiedText === 'Frontend RBAC' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Para ocultar o mostrar componentes, botones o secciones completas a los usuarios de manera condicional basándose en su rol de base de datos:
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto">
{`import { useAuth } from '../hooks/useAuth';

export const MiComponente = () => {
  const { user } = useAuth(); // Extraer el usuario logueado
  
  return (
    <div>
      <h3>Gestión General</h3>
      
      {/* Opción visible ÚNICAMENTE para el rol SuperAdmin */}
      {user?.role === 'SuperAdmin' && (
        <Button variant="primary">
          Configuraciones Críticas
        </Button>
      )}
    </div>
  );
};`}
                  </pre>
                </div>
              </div>

              {/* Roles en el Backend */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    Control de Permisos de Endpoints en el Backend (FastAPI)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(`def require_role(allowed_roles: List[str]):
    def dependency(current_user: User = Depends(deps.get_current_user)):
        if current_user.rol.nombre not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Permisos insuficientes"
            )
        return current_user
    return dependency`, 'Backend RBAC')}>
                    {copiedText === 'Backend RBAC' ? 'Copiado' : 'Copiar Código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 ml-8">
                  Crea una dependencia en <code className="font-mono text-indigo-600">backend/app/api/deps.py</code> para restringir el consumo del API en base a roles autorizados:
                </p>
                <div className="ml-8 overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-950/90 text-slate-200 text-xs font-mono p-4 border border-slate-800">
                  <pre className="overflow-x-auto">
{`from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.api import deps

def require_role(allowed_roles: List[str]):
    def dependency(current_user: User = Depends(deps.get_current_user)):
        # Validar si el nombre del rol del usuario está dentro de los permitidos
        if current_user.rol.nombre not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="No tienes permisos para realizar esta acción."
            )
        return current_user
    return dependency

# Uso en tus endpoints (productos.py):
@router.post("/", response_model=ProductoResponse)
def create_producto(
    producto_in: ProductoCreate,
    db: Session = Depends(deps.get_db),
    # Solo permite a usuarios con el rol 'SuperAdmin' o 'Admin'
    current_user: User = Depends(require_role(["SuperAdmin", "Admin"]))
):
    return producto_service.create(db, obj_in=producto_in)`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default DevGuide;
