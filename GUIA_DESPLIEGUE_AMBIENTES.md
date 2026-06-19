# Guía de Despliegue y Configuración de Ambientes

Esta guía detalla los diferentes ambientes disponibles en el sistema de Vialidades (Desarrollo Local vs Producción Docker), los puertos asignados a cada servicio y la configuración de variables de entorno (`.env`).

---

## 1. Puertos Asignados por Servicio

El sistema consta de 3 servicios principales. En producción, estos puertos se definen en el archivo `.env` del servidor y se mapean a través de `docker-compose.yml`:

| Servicio | Puerto en Servidor (Host) | Puerto Interno (Contenedor) | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend (FastAPI)** | `8005` (configurable con `PORT_BACKEND`) | `8000` | API del sistema y servicio de archivos estáticos (firmas, logos). |
| **Frontend Admin (React)** | `8085` (configurable con `PORT_FRONTEND_ADMIN`) | `80` | Panel administrativo de uso interno de la Alcaldía. |
| **Frontend Público (React)** | `8086` (configurable con `PORT_FRONTEND_PUBLIC`) | `80` | Validador público de códigos QR para ciudadanos. |

---

## 2. Configuración de Ambientes

### Ambiente A: Desarrollo Local (Sin Docker)
Se ejecuta directamente en la máquina del desarrollador para pruebas rápidas.

#### Backend
- **Puerto**: `8000`
- **Comando**:
  ```bash
  cd backend
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

#### Frontend Admin (Panel Interno)
- **Puerto**: `5173` (Puerto por defecto de Vite)
- **Archivo de configuración (`frontend/.env`)**:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```
- **Comando**:
  ```bash
  cd frontend
  npm run dev
  ```

#### Frontend Público (Verificador)
- **Puerto**: `5174` (Puerto alternativo de Vite)
- **Archivo de configuración (`frontend-public/.env`)**:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```
- **Comando**:
  ```bash
  cd frontend-public
  npm run dev
  ```

---

### Ambiente B: Producción (Con Docker y docker-compose)
Se ejecuta en el servidor de producción (por ejemplo, Rocky Linux con Docker).

Todo el despliegue se controla mediante el archivo `.env` ubicado en la raíz del proyecto (`/var/www/vialidad/.env`).

#### Plantilla del archivo `.env` para Producción:
```env
# ==============================================================================
# 1. PUERTOS EN EL SERVIDOR HOST
# ==============================================================================
PORT_BACKEND=8005
PORT_FRONTEND_ADMIN=8085
PORT_FRONTEND_PUBLIC=8086

# ==============================================================================
# 2. CONFIGURACIÓN DEL BACKEND (FastAPI)
# ==============================================================================
# Cadena de conexión a SQL Server externa
DATABASE_URL=mssql+pyodbc://usuario:contraseña@IP_BASE_DATOS:PUERTO/DB_NAME?driver=ODBC+Driver+17+for+SQL+Server

# Claves de firma de Tokens (Generar con openssl rand -hex 32)
SECRET_KEY=clave_secreta_aqui
REFRESH_SECRET_KEY=clave_secreta_refresh_aqui

# Tiempos de expiración
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7

# URLs de Origen (CORS y redirecciones)
# IMPORTANTE: Reemplazar <IP_DEL_SERVIDOR> por la IP pública o dominio del servidor.
FRONTEND_URL=http://<IP_DEL_SERVIDOR>:8085
VALIDATOR_URL=http://<IP_DEL_SERVIDOR>:8086

# Seguridad de acceso
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=5

# ==============================================================================
# 3. CONFIGURACIÓN DE LOS FRONTENDS (Vite / React)
# ==============================================================================
# NOTA: Estas URLs se incrustan en el código empaquetado durante la compilación.
# Deben apuntar a la IP del servidor y el puerto público expuesto por la API (8005).
VITE_API_URL_ADMIN=http://<IP_DEL_SERVIDOR>:8005/api
VITE_API_URL_PUBLIC=http://<IP_DEL_SERVIDOR>:8005/api
```

---

## 3. Instrucciones de Despliegue en Servidor (Paso a Paso)

Cuando actualices valores en el archivo `.env` o despliegues por primera vez, ejecuta los siguientes comandos en la terminal de tu servidor:

1. **Guardar cambios en el `.env`**:
   Asegúrate de cambiar todas las apariciones de `<IP_DEL_SERVIDOR>` por la dirección IP real del servidor de producción (por ejemplo, `192.168.20.103` o tu nombre de dominio DNS).

2. **Recompilar las imágenes y levantar el stack**:
   Dado que los frontends incrustan las variables de entorno (`VITE_API_URL_*`) durante la compilación del build estático, **cualquier cambio en el `.env` requiere recompilar los contenedores frontend**:
   ```bash
   cd /var/www/vialidad
   
   # Detiene y limpia contenedores viejos
   docker compose down
   
   # Compila todas las aplicaciones (Backend y ambos Frontends)
   docker compose build
   
   # Levanta el stack completo en segundo plano (detached)
   docker compose up -d
   ```

3. **Verificar el estado de ejecución**:
   ```bash
   docker compose ps
   ```
   Debes ver los 3 servicios con estado `Up` y sus respectivos puertos mapeados:
   - `vialidad-backend` corriendo en puerto `8005`
   - `vialidad-admin` corriendo en puerto `8085`
   - `vialidad-verificador` corriendo en puerto `8086`

---

## 4. Comandos de Docker para Monitoreo y Depuración

Aquí tienes los comandos esenciales de Docker para ver logs, monitorear recursos y depurar problemas dentro del servidor de producción:

### Ver Logs (Bitácoras) de los Contenedores

- **Ver logs de todo el stack en tiempo real (seguimiento continuo)**:
  ```bash
  docker compose logs -f
  ```

- **Ver logs de un servicio específico (ejemplo: Backend)**:
  ```bash
  docker compose logs -f backend
  ```

- **Ver las últimas 100 líneas de logs de un contenedor usando su nombre directo**:
  ```bash
  docker logs --tail 100 -f vialidad-backend
  ```

### Entrar e Interactuar dentro de los Contenedores (Terminal)

- **Acceder a la terminal (shell/bash) del contenedor del Backend**:
  ```bash
  docker compose exec backend bash
  ```
  *(Útil para revisar archivos internos, base de datos, o probar Chromium directamente).*

- **Acceder a la terminal en el contenedor de administración o público**:
  ```bash
  docker compose exec frontend-admin sh
  docker compose exec frontend-public sh
  ```

### Monitorear Estado y Consumo de Recursos

- **Ver el consumo de CPU, Memoria y Red de los contenedores activos**:
  ```bash
  docker stats
  ```

- **Listar todos los contenedores levantados y sus estados**:
  ```bash
  docker compose ps
  ```

- **Revisar espacio en disco ocupado por Docker (limpieza de imágenes huérfanas)**:
  ```bash
  # Ver uso de disco de Docker
  docker system df
  
  # Limpiar caché de compilación y contenedores parados para liberar espacio
  docker system prune -f
  ```

