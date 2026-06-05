# Base de Proyecto React + FastAPI (SQL Server)

Esta es una plantilla base (boilerplate) de nivel empresarial diseñada para acelerar la creación de nuevas aplicaciones web con un alto estándar de código, modularidad, robustez ante fallos y máxima seguridad.

---

## Stack Tecnológico

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Base de Datos:** Microsoft SQL Server (a través de `Session` de SQLAlchemy)
- **ORM:** SQLAlchemy 2.0 (Mapeo declarativo moderno con anotaciones de tipado)
- **Driver:** PyODBC (`mssql+pyodbc`)
- **Infraestructura Base:**
  - **CRUD Base Genérico:** Repositorio abstracto reutilizable para cualquier tabla.
  - **Manejador de Excepciones Global:** Captura de conflictos SQL Server (`IntegrityError`) y errores no controlados con UUID de rastreo.
  - **Carga de Archivos Segura:** Límite de 5MB, validación de tipo MIME y nombres únicos basados en UUID contra Path Traversal.
  - **Seguridad JWT:** Access y Refresh Tokens persistidos con rotación de tokens.
  - **Protección Fuerza Bruta:** Bloqueo temporal de cuentas tras 5 intentos fallidos.

### Frontend
- **Framework:** React 19 (con Vite)
- **Estilos:** Tailwind CSS v4 con variables CSS corporativas (`#101c4e`)
- **Fuentes:** Inter & Outfit (Google Fonts)
- **Routing:** React Router DOM v7
- **Manejo de Estado/Caché:** TanStack Query v5 con persistencia local
- **Resiliencia:** `<ErrorBoundary />` global que evita las pantallas en blanco.
- **Loading Skeletons:** Componente `<Skeleton />` animado con Shimmer Effect en variantes: texto, círculo y tabla.
- **Validaciones Especiales:** Algoritmos Mod-10 y Luhn en tiempo real para DUI, NIT y Teléfono de El Salvador.

---

## Estructura del Proyecto

```
BaseReactPython/
├── backend/                  # FastAPI Backend (Python)
│   ├── app/
│   │   ├── api/              # Capa de Endpoints (Controladores) e inyección de dependencias
│   │   │   ├── deps.py       # Dependencias get_db, get_current_user
│   │   │   └── v1/
│   │   │       ├── router.py # Enrutador principal de endpoints
│   │   │       └── endpoints/# Archivos de endpoints por entidad (auth.py, utils.py)
│   │   ├── core/             # Configuraciones globales, base de datos y middlewares
│   │   │   ├── config.py     # Variables de entorno tipadas con Pydantic
│   │   │   ├── database.py   # Motor de BD SQLAlchemy e inicializador
│   │   │   ├── middleware.py # Cabeceras HTTP de seguridad avanzada
│   │   │   └── security.py   # Hashing de bcrypt y encriptación JWT
│   │   ├── models/           # Modelos de SQLAlchemy 2.0 (Tablas físicas de SQL Server)
│   │   │   └── user.py
│   │   ├── schemas/          # Esquemas de Pydantic v2 (Validación de entradas y respuestas)
│   │   │   └── auth.py
│   │   ├── services/         # Capa de Servicios (Lógica de Negocio y Reglas)
│   │   │   ├── auth.py
│   │   │   ├── base.py       # Clase abstracta CRUDBase genérica
│   │   │   └── uploader.py   # Servicio de subida segura de archivos
│   │   └── main.py           # Archivo de inicio del servidor FastAPI
│   ├── static/               # Almacenamiento local de archivos estáticos
│   ├── requirements.txt      # Dependencias de Python
│   └── .env                  # Variables del servidor (Base de datos, JWT)
├── frontend/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/              # Configuración de clientes Axios e interceptores de auto-refresh
│   │   ├── components/       # Componentes visuales organizados por contexto
│   │   │   ├── Common/       # UI Reutilizable (Button, Input, Select, Modal, ErrorBoundary, Skeleton)
│   │   │   └── Layout/       # Componentes de layouts (DashboardLayout)
│   │   ├── hooks/            # Hooks de TanStack Query y persistencia
│   │   ├── lib/              # Inicializaciones de librerías externas (QueryClient)
│   │   ├── pages/            # Vistas principales (Login, Dashboard, Catalog)
│   │   ├── utils/            # Validadores y formateadores de El Salvador
│   │   ├── App.jsx           # Mapeo de rutas generales y protecciones públicas/privadas
│   │   ├── index.css         # Diseño global con Tailwind
│   │   └── main.jsx          # Punto de entrada de renderizado
│   ├── package.json          # Dependencias de JavaScript
│   └── .env                  # Variables de entorno del cliente
```

---

# GUÍA DEL DESARROLLADOR: CÓMO GENERAR UN NUEVO MÓDULO O PÁGINA (PASO A PASO)

Sigue esta guía secuencial y limpia para crear cualquier nuevo módulo en el proyecto utilizando las ventajas del CRUD genérico, skeletons y validaciones integradas. Para este ejemplo, crearemos un módulo de **"Productos"**.

---

## 1. FASE BACKEND (`backend/app/`)

### Paso A: Crear el Modelo de SQLAlchemy (Base de Datos)
Crea el archivo `backend/app/models/producto.py`. Este archivo define la tabla física en SQL Server.

```python
from sqlalchemy import BigInteger, String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Producto(Base):
    __tablename__ = "PRODUCTOS"

    codigo_producto: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
```
> [!TIP]
> Importa tu nuevo modelo dentro de la función `init_db()` en `backend/app/core/database.py` (ej. `from app.models.producto import Producto`) para que SQLAlchemy cree automáticamente la tabla en SQL Server al levantar el servidor.

---

### Paso B: Crear los Esquemas de Pydantic (Validación)
Crea el archivo `backend/app/schemas/producto.py`. Mapea la entrada y salida de datos del API.

```python
from pydantic import BaseModel, Field

# Atributos comunes
class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    precio: float = Field(..., gt=0, description="El precio debe ser mayor a cero")

# Esquema para crear un producto
class ProductoCreate(ProductoBase):
    pass

# Esquema para actualizar un producto
class ProductoUpdate(ProductoBase):
    activo: bool

# Esquema que retorna la API
class ProductoResponse(ProductoBase):
    codigo_producto: int
    activo: bool

    class Config:
        from_attributes = True
```

---

### Paso C: Crear el Servicio Heredando de `CRUDBase`
Crea el archivo `backend/app/services/producto.py`. Hereda las operaciones de base de datos sin escribir SQL.

```python
from app.services.base import CRUDBase
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate

class CRUDProducto(CRUDBase[Producto, ProductoCreate, ProductoUpdate]):
    # Si requieres métodos de base de datos específicos, puedes escribirlos aquí.
    pass

# Instancia del servicio lista para usar
producto_service = CRUDProducto(Producto)
```

---

### Paso D: Crear los Endpoints del API
Crea el archivo `backend/app/api/v1/endpoints/productos.py`. Expón la lógica al exterior con seguridad JWT.

```python
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.producto import ProductoResponse, ProductoCreate, ProductoUpdate
from app.services.producto import producto_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ProductoResponse])
def get_productos(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user), # Protegido con JWT
    skip: int = 0,
    limit: int = 100
):
    return producto_service.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(
    producto_in: ProductoCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return producto_service.create(db, obj_in=producto_in)
```

---

### Paso E: Registrar el Endpoint en el Enrutador
Abre `backend/app/api/v1/router.py` e incluye el router de productos:

```python
from app.api.v1.endpoints import auth, utils, productos # Importar nuevo endpoint

api_router.include_router(productos.router, prefix="/productos", tags=["Productos"])
```

---

## 2. FASE FRONTEND (`frontend/src/`)

### Paso A: Crear el Servicio de Axios
Crea el archivo `frontend/src/api/productoService.js` para consumir los endpoints.

```javascript
import api from './axios';

export const productoService = {
  getProductos: async () => {
    const res = await api.get('/productos');
    return res.data;
  },
  createProducto: async (data) => {
    const res = await api.post('/productos', data);
    return res.data;
  }
};
```

---

### Paso B: Crear la Pantalla con Layout, Formulario de Registro y Skeletons
Crea el archivo `frontend/src/pages/Productos.jsx`. Diseña una interfaz responsiva integrada en el Dashboard que incluya la creación y lectura de datos.

```jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input, Skeleton } from '../components/Common';
import { productoService } from '../api/productoService';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inicialización de react-hook-form con campos del formulario
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { nombre: '', precio: '' }
  });

  const fetchProductos = async () => {
    try {
      const data = await productoService.getProductos();
      setProductos(data);
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Función asíncrona de envío (Submit)
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await productoService.createProducto(data);
      toast.success('¡Producto registrado con éxito!');
      reset(); // Limpiar campos del formulario
      fetchProductos(); // Recargar la lista desde la base de datos
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
        
        {/* Formulario de Creación */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 h-fit space-y-4 shadow-sm">
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
            /* Esqueleto de Carga Animado (Shimmer) */
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
              <Skeleton variant="table" count={4} />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold dark:text-white mb-4">Catálogo de Productos</h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {productos.map(p => (
                  <li key={p.codigo_producto} className="py-3 flex justify-between text-sm dark:text-slate-200">
                    <span>{p.nombre}</span>
                    <span className="font-semibold text-indigo-600">${p.precio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Productos;
```

---

### Paso C: Registrar la Nueva Ruta en el Router de React
Abre `frontend/src/App.jsx` y agrega la importación y la ruta correspondiente dentro del árbol:

```jsx
import Productos from './pages/Productos';

// En el enrutador de App.jsx:
<Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
```

---

¡Siguiendo estos sencillos y estandarizados pasos, cualquier desarrollador del equipo será capaz de añadir nuevos módulos robustos, seguros y fluidos al sistema en cuestión de minutos!
