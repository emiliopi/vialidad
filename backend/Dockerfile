# Etapa 1: Constructor (Versión Completa)
FROM python:3.11-bullseye as builder

WORKDIR /app

# Como ya trae los compiladores, solo instalamos la librería de odbc por HTTP
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalamos paquetes de Python ignorando el firewall SSL
RUN pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements.txt


# Etapa 2: Imagen Final de Ejecución
FROM python:3.11-bullseye as runner

WORKDIR /app

# Instalamos solo lo estrictamente necesario de Microsoft y el sistema
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends \
    unixodbc \
    chromium \
    libmagic1 \
    && curl -k https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl -k https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get -o Acquire::ForceIPv4=true update \
    && ACCEPT_EULA=Y apt-get -o Acquire::ForceIPv4=true install -y --no-install-recommends msodbcsql17 \
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