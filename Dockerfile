# ── Filatex PMO Dashboard — Production Dockerfile ──────────────────────────
# Target: Google Cloud Run (port 8080, gunicorn WSGI server)

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for openpyxl (lxml, et-xmlfile)
# and pandas (numpy C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python backend
COPY app.py config.py cache.py data_loader.py api_data.py sharepoint_client.py utils.py ./

# Copy parsers package
COPY parsers/ ./parsers/

# Copy frontend static files
COPY index.html ./
COPY js/ ./js/
COPY css/ ./css/

# Cloud Run injects PORT at runtime (default 8080)
ENV PORT=8080

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Expose Cloud Run's expected port
EXPOSE 8080

# Gunicorn: 2 workers × 4 threads is appropriate for a dashboard with
# mostly I/O-bound work (SharePoint API calls). Adjust via env vars.
CMD exec gunicorn \
    --bind "0.0.0.0:${PORT}" \
    --workers "${GUNICORN_WORKERS:-2}" \
    --threads "${GUNICORN_THREADS:-4}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --log-level "${LOG_LEVEL:-info}" \
    --access-logfile - \
    --error-logfile - \
    app:app
