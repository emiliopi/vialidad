# Guía para Levantar el Servicio en Local (Frontend y Backend)

Esta guía detalla los pasos necesarios para configurar y ejecutar localmente tanto el backend (FastAPI) como el frontend (React + Vite) de este proyecto.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu equipo:
1. **Python** (Versión 3.11 o superior).
2. **Node.js** (Versión 18 o superior) y **npm**.
3. **Microsoft SQL Server** (Local o accesible en red) y soporte para controladores **ODBC**.
   - Se recomienda tener instalado **ODBC Driver 17 for SQL Server** o **ODBC Driver 18 for SQL Server**.

---

## 1. Configuración del Backend (FastAPI)

El backend está ubicado en la carpeta `/backend`.

### Paso 1.1: Acceder al directorio del Backend
Abre una terminal y colócate en la carpeta del backend:
```bash
cd backend
```

### Paso 1.2: Crear y activar un entorno virtual (Recomendado)
Para mantener limpias las dependencias de tu sistema:

* **En Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
* **En Windows (CMD):**
  ```cmd
  python -m venv venv
  .\venv\Scripts\activate.bat
  ```
* **En macOS/Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Paso 1.3: Instalar las dependencias
Con el entorno virtual activo, instala los paquetes requeridos:
```bash
pip install -r requirements.txt
```

### Paso 1.4: Configurar variables de entorno
1. Duplica el archivo `.env.example` y cámbiale el nombre a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y edita las siguientes variables clave según tu configuración:
   - `DATABASE_URL`: Cadena de conexión para tu instancia de SQL Server. Por ejemplo:
     - Si usas ODBC Driver 17: `DATABASE_URL=mssql+pyodbc://usuario:contraseña@localhost:1433/BaseReactPythonDb?driver=ODBC+Driver+17+for+SQL+Server`
     - Si usas ODBC Driver 18 (añade parámetros de seguridad adicionales si no tienes SSL): `DATABASE_URL=mssql+pyodbc://usuario:contraseña@localhost:1433/BaseReactPythonDb?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes`
   - `PORT`: Puerto en el que se levantará el servicio backend (por defecto `8000`).

### Paso 1.5: Iniciar el servidor de desarrollo
Puedes iniciar el servidor de dos formas:

1. Ejecutando el script de inicio directamente (añade automáticamente el PYTHONPATH):
   ```bash
   python app/main.py
   ```
2. O bien mediante Uvicorn desde la raíz de la carpeta `/backend`:
   ```bash
   uvicorn app.main:app --reload
   ```

El backend estará disponible en `http://localhost:8000` y la documentación interactiva en `http://localhost:8000/docs`.

---

## 2. Configuración del Frontend (React + Vite)

El frontend está ubicado en la carpeta `/frontend`.

### Paso 2.1: Acceder al directorio del Frontend
Abre una nueva pestaña o ventana en tu terminal y dirígete al frontend:
```bash
cd frontend
```

### Paso 2.2: Instalar las dependencias de Node
Instala los paquetes necesarios definidos en el `package.json`:
```bash
npm install
```

### Paso 2.3: Configurar variables de entorno
1. Duplica el archivo `.env.example` y renombralo como `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configura el archivo `.env` para apuntar a la URL del backend local:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

### Paso 2.4: Levantar el servidor de desarrollo
Ejecuta el comando para iniciar el entorno de desarrollo con Vite:
```bash
npm run dev
```

El frontend estará listo en el navegador en la dirección `http://localhost:5173`.

---

## Resumen de puertos por defecto
- **Frontend (React/Vite):** `http://localhost:5173`
- **Backend (FastAPI):** `http://localhost:8000`
- **Documentación API (Swagger):** `http://localhost:8000/docs`
