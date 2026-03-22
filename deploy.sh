#!/usr/bin/env bash
# ── Filatex PMO Dashboard — Cloud Run Deployment Script ─────────────────────
# Usage:
#   ./deploy.sh                    # Build + push + deploy (full pipeline)
#   ./deploy.sh build              # Build and push image only
#   ./deploy.sh deploy             # Deploy latest image (skip build)
#   ./deploy.sh secrets            # Create/update Secret Manager secrets
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - Docker installed and running (for local builds)
#   - gcloud config set project <PROJECT_ID>
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-europe-west1}"
SERVICE="${GCP_SERVICE:-filatex-dashboard}"
REPO="${GCP_REPO:-filatex}"                                # Artifact Registry repo name
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/dashboard"
TAG="${IMAGE}:$(git rev-parse --short HEAD 2>/dev/null || echo latest)"

# ── Helpers ──────────────────────────────────────────────────────────────────
log() { echo "[deploy] $*"; }
die() { echo "[deploy] ERROR: $*" >&2; exit 1; }

[[ -n "$PROJECT_ID" ]] || die "GCP_PROJECT not set and gcloud default project not configured."

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_build() {
  log "Building image: ${TAG}"
  # Pull latest for layer cache, ignore failure (first build)
  docker pull "${IMAGE}:latest" 2>/dev/null || true
  docker build \
    --tag "${TAG}" \
    --tag "${IMAGE}:latest" \
    --cache-from "${IMAGE}:latest" \
    .
  log "Pushing image..."
  docker push "${TAG}"
  docker push "${IMAGE}:latest"
  log "Build complete."
}

cmd_deploy() {
  local deploy_image="${TAG}"
  log "Deploying ${SERVICE} → ${REGION} (image: ${deploy_image})"

  gcloud run deploy "${SERVICE}" \
    --image="${deploy_image}" \
    --region="${REGION}" \
    --platform=managed \
    \
    --allow-unauthenticated \
    \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --concurrency=80 \
    \
    --set-env-vars="\
LOG_LEVEL=INFO,\
DATA_BASE_PATH=Fichiers de DOSSIER DASHBOARD - Data_Dashbords,\
TTL_HFO_SITES=3600,\
TTL_ENR_SITES=3600,\
TTL_HFO_PROJECTS=1800,\
TTL_ENR_PROJECTS=900,\
TTL_CAPEX=3600,\
TTL_REPORTING=900,\
TTL_INVESTMENTS=900,\
TTL_DEFAULT=900,\
REFRESH_AHEAD_SECONDS=120,\
REFRESH_WORKER_INTERVAL=60,\
GUNICORN_WORKERS=2,\
GUNICORN_THREADS=4,\
GUNICORN_TIMEOUT=120" \
    \
    --set-secrets="\
AZURE_TENANT_ID=filatex-azure-tenant-id:latest,\
AZURE_CLIENT_ID=filatex-azure-client-id:latest,\
AZURE_CLIENT_SECRET=filatex-azure-client-secret:latest,\
ONEDRIVE_DRIVE_ID=filatex-onedrive-drive-id:latest"

  log "Deploy complete."
  log "Service URL:"
  gcloud run services describe "${SERVICE}" --region="${REGION}" \
    --format="value(status.url)"
}

cmd_secrets() {
  log "Creating/updating Secret Manager secrets for project: ${PROJECT_ID}"
  log "You will be prompted for each secret value."

  local secrets=(
    "filatex-azure-tenant-id:AZURE_TENANT_ID"
    "filatex-azure-client-id:AZURE_CLIENT_ID"
    "filatex-azure-client-secret:AZURE_CLIENT_SECRET"
    "filatex-onedrive-drive-id:ONEDRIVE_DRIVE_ID"
  )

  for entry in "${secrets[@]}"; do
    secret_name="${entry%%:*}"
    env_var="${entry##*:}"
    echo -n "Enter value for ${env_var} (stored as ${secret_name}): "
    read -rs secret_value
    echo

    # Create secret if it doesn't exist, then add a new version
    if gcloud secrets describe "${secret_name}" --project="${PROJECT_ID}" &>/dev/null; then
      echo "${secret_value}" | gcloud secrets versions add "${secret_name}" \
        --data-file=- --project="${PROJECT_ID}"
      log "Updated secret: ${secret_name}"
    else
      echo "${secret_value}" | gcloud secrets create "${secret_name}" \
        --data-file=- --project="${PROJECT_ID}" \
        --replication-policy=automatic
      log "Created secret: ${secret_name}"
    fi
  done

  log "All secrets stored. Grant Cloud Run SA access with:"
  log "  gcloud projects add-iam-policy-binding ${PROJECT_ID} \\"
  log "    --member=serviceAccount:<SA_EMAIL> \\"
  log "    --role=roles/secretmanager.secretAccessor"
}

# ── Entrypoint ────────────────────────────────────────────────────────────────
ACTION="${1:-all}"
case "$ACTION" in
  build)   cmd_build ;;
  deploy)  cmd_deploy ;;
  secrets) cmd_secrets ;;
  all)     cmd_build && cmd_deploy ;;
  *)       die "Unknown action '${ACTION}'. Use: build | deploy | secrets | all" ;;
esac
