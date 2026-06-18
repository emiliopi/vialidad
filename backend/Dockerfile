# Etapa 1: Construcción (Builder)
# Usamos Bullseye (Debian 11) para compatibilidad total con el driver de Microsoft
FROM python:3.11-slim-bullseye as builder

WORKDIR /app

# 1. Instalamos dependencias de compilación por HTTP normal (Sin el comando 'sed')
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 2. Creamos un entorno virtual en un directorio público para evitar problemas de permisos luego
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 3. Instalamos dependencias de Python ignorando la verificación SSL del firewall (--trusted-host)
RUN pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements.txt


# Etapa 2: Imagen Final de Ejecución (Runner)
FROM python:3.11-slim-bullseye as runner

WORKDIR /app

# 4. Instalamos dependencias de ejecución e incluimos la bandera '-k' en curl para ignorar el bloqueo SSL
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc \
    curl \
    gnupg \
    chromium \
    libmagic1 \
    && curl -k https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl -k https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get -o Acquire::ForceIPv4=true update \
    && ACCEPT_EULA=Y apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Copiamos el entorno virtual ya compilado desde la Etapa 1
COPY --from=builder /opt/venv /opt/venv
COPY . .

# Activamos el entorno virtual para que Python encuentre los paquetes
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Creamos un usuario sin privilegios por seguridad y le damos permisos sobre la app
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck interno del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Comando de arranque de tu aplicación FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]