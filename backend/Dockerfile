# ==========================================
# ETAPA 1: Constructor (Donde preparamos Python)
# ==========================================
FROM python:3.11-bullseye AS builder

WORKDIR /app

# 1. Instalamos la librería de odbc por HTTP
RUN (ip link set dev eth0 mtu 1400 || true) \
    && sed -i 's/deb.debian.org/mirrors.cloudflare.com/g' /etc/apt/sources.list \
    && sed -i 's/http:/https:/g' /etc/apt/sources.list \
    && apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 2. Creamos entorno virtual público
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 3. Instalamos dependencias de Python esquivando SSL
RUN pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements.txt


# ==========================================
# ETAPA 2: Imagen Final (La que correrá el servidor)
# ==========================================
FROM python:3.11-bullseye AS runner

WORKDIR /app

# 4. Instalamos lo ligero y el driver de Microsoft
RUN (ip link set dev eth0 mtu 1400 || true) \
    && sed -i 's/deb.debian.org/mirrors.cloudflare.com/g' /etc/apt/sources.list \
    && sed -i 's/http:/https:/g' /etc/apt/sources.list \
    && apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc \
    libmagic1 \
    && curl -k https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl -k https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get -o Acquire::ForceIPv4=true update \
    && ACCEPT_EULA=Y apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# 5. Instalamos Chromium COMPLETAMENTE SEPARADO y con reintentos para que la red no lo bote
RUN (ip link set dev eth0 mtu 1400 || true) \
    && apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=10 -o Acquire::http::Timeout=600 update \
    && apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=10 -o Acquire::http::Timeout=600 install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*

# 6. AHORA SÍ: Copiamos el entorno virtual de la Etapa 1
COPY --from=builder /opt/venv /opt/venv
COPY . .

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# 7. Creamos el usuario sin privilegios
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# 8. Healthcheck de FastAPI
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]