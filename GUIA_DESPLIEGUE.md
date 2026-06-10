# Guía de Configuración y Despliegue: Frontend Separado (Admin vs Público)

Esta guía detalla cómo probar localmente y desplegar en producción (Docker / Rocky Linux) la arquitectura de doble frontend implementada para el sistema de vialidades:

1. **Panel Administrativo (`frontend`)**: Uso interno de la alcaldía.
2. **Validador Público (`frontend-public`)**: Validador de boletas accesible por los ciudadanos.

---

## 1. Pruebas Locales (Red Local / LAN)

### Frontend Público (`frontend-public`)
Ubicado en la carpeta `/frontend-public`. Este proyecto se ha configurado por defecto en el puerto **`5174`**.

1. **Instalación de Dependencias**:
   ```bash
   cd frontend-public
   npm install
   ```

2. **Configuración de Variables de Entorno (`.env`)**:
   Para probar desde otras computadoras o dispositivos móviles en la misma red local, edita el archivo `frontend-public/.env` y coloca la IP de la máquina servidor en lugar de `localhost`:
   ```env
   VITE_API_URL=http://192.168.14.55:8000/api
   ```
   *Nota: Cada vez que modifiques el archivo `.env`, debes detener el servidor (`Ctrl + C`) y volverlo a iniciar.*

3. **Ejecutar en Desarrollo**:
   ```bash
   npm run dev
   ```

### Backend (`backend`)
Para que el backend acepte peticiones desde otros dispositivos de la red local, debe escuchar en todas las interfaces de red (`0.0.0.0`):

* **Comando para iniciar el Backend**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

### Cortafuegos (Firewall)
Si otros dispositivos no pueden conectar a pesar de tener la IP correcta en el `.env`, debes abrir los puertos correspondientes en el Firewall del sistema operativo:
* Puerto **`8000`** (Backend API)
* Puerto **`5174`** (Frontend Público)
* Puerto **`5173`** (Frontend Admin)

---

## 2. Despliegue en Producción (Docker en Rocky Linux)

En el entorno de producción en Rocky Linux, se compilarán los bundles estáticos y se servirán mediante servidores web Nginx independientes.

### Contenedor de Administración (`vialidad-admin`)
* **Propósito**: Panel administrativo.
* **Puerto/Acceso**: Puerto interno (`8080`) o subdominio administrativo. 
* **Seguridad**: Se recomienda bloquear este puerto a nivel de Rocky Linux (`firewalld` o reglas de Docker) permitiendo únicamente el acceso a la subred de la Alcaldía o mediante VPN.

### Contenedor Público (`vialidad-verificador`)
* **Propósito**: Validador ciudadano de códigos QR.
* **Puerto/Acceso**: Puertos públicos standard `80` (HTTP) o `443` (HTTPS) bajo tu dominio público.
* **Seguridad**: Al estar totalmente podado, el bundle compilado de este contenedor no contiene lógica administrativa, componentes sensibles ni URLs del panel interno, eliminando riesgos de ingeniería inversa.

---

## 3. Comportamientos y Rutas en Producción

### Redirecciones de Seguridad
* **Público (`frontend-public`)**: Cualquier intento de navegar a la raíz `/` o rutas inexistentes redirige permanentemente al validador (`/verificar`), ocultando cualquier pantalla de login interna.
* **Privado (`frontend`)**: Exige autenticación JWT obligatoria en todas las rutas a través del componente `<ProtectedRoute />` del enrutador de React.
