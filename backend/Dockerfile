# Etapa 1: Construcción
# Cambio: Especificamos 'bullseye' para que coincida con el repositorio de Microsoft
FROM python:3.11-slim-bullseye as builder

WORKDIR /app

# FIX 1: Eliminamos el comando 'sed' para que use HTTP normal y no choque con el firewall
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# FIX 2: Usamos un entorno virtual (venv) en lugar de --user para evitar problemas de permisos
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 2: Imagen Final de Ejecución (Mínima y segura)
FROM python:3.11-slim-bullseye as runner

WORKDIR /app

# FIX 1: Eliminamos el 'sed' también en esta etapa
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc \
    curl \
    gnupg \
    chromium \
    libmagic1 \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get -o Acquire::ForceIPv4=true update \
    && ACCEPT_EULA=Y apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Copiar el entorno virtual con las dependencias desde la etapa anterior
COPY --from=builder /opt/venv /opt/venv
COPY . .

# Activar el entorno virtual para que Python encuentre los paquetes
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Crear un usuario sin privilegios y darle propiedad de la carpeta /app
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck interno del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]