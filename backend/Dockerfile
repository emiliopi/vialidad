# Etapa 2: Imagen Final de Ejecución
FROM python:3.11-bullseye as runner

WORKDIR /app

# 1. Instalamos lo ligero y el driver de Microsoft primero
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc \
    libmagic1 \
    && curl -k https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl -k https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get -o Acquire::ForceIPv4=true update \
    && ACCEPT_EULA=Y apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalamos Chromium COMPLETAMENTE SEPARADO y con reglas agresivas de reintento
# Le damos 10 reintentos y 600 segundos (10 min) de tolerancia por corte
RUN apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=10 -o Acquire::http::Timeout=600 update \
    && apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=10 -o Acquire::http::Timeout=600 install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
COPY . .

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Usuario sin privilegios por seguridad
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]