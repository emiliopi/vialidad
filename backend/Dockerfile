# Etapa 1: Construcción
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependencias necesarias para compilar drivers (como pyodbc y dependencias de sistema si aplican)
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Crear una instalación de paquetes aislada para copiar a la imagen final
RUN pip install --no-cache-dir --user -r requirements.txt

# Etapa 2: Imagen Final de Ejecución (Mínima y segura)
FROM python:3.11-slim as runner

WORKDIR /app

# Instalar MS ODBC SQL Server driver, dependencias de ejecución de ODBC, Chromium Headless y libmagic
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

# Copiar dependencias desde la etapa anterior
COPY --from=builder /root/.local /root/.local
COPY . .

# Configurar variable de entorno para que los paquetes del builder estén disponibles
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Crear un usuario sin privilegios por razones de seguridad
RUN useradd -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck interno del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
