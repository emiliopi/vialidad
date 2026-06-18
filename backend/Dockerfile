# Etapa 1: Constructor (Alpine)
FROM python:3.11-alpine as builder

WORKDIR /app

# Instalar herramientas de compilación ligeras para Alpine
RUN apk add --no-cache \
    build-base \
    unixodbc-dev \
    curl \
    gnupg

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalación de paquetes ignorando SSL por si acaso
RUN pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements.txt


# Etapa 2: Ejecución Final
FROM python:3.11-alpine as runner

WORKDIR /app

# Instalar dependencias de ejecución, Chromium y el Driver de Microsoft para Alpine
RUN apk add --no-cache \
    unixodbc \
    curl \
    gnupg \
    chromium \
    libmagic

# Descargar las llaves y el driver de Microsoft específicos para Alpine Linux
RUN curl -k https://packages.microsoft.com/keys/microsoft.asc | gpg --import - \
    && curl -k https://packages.microsoft.com/config/alpine/3.15/prod.list > /etc/apk/repositories.d/mssql-release.repo \
    && apk update \
    && ACCEPT_EULA=Y apk add --no-cache msodbcsql17

COPY --from=builder /opt/venv /opt/venv
COPY . .

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Crear usuario seguro en Alpine
RUN adduser -D -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]