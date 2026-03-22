# Deploying Filatex PMO Dashboard to Google Cloud Run

## Prerequisites

1. **gcloud CLI** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Docker** installed and running (only for `./deploy.sh build` / local builds).

3. **APIs enabled** in your GCP project:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com
   ```

4. **Artifact Registry repository** created:
   ```bash
   gcloud artifacts repositories create filatex \
     --repository-format=docker \
     --location=europe-west1 \
     --description="Filatex dashboard images"
   ```

---

## 1 — Store SharePoint credentials in Secret Manager

Run the interactive helper (prompts for each value):

```bash
./deploy.sh secrets
```

This creates four secrets:
| Secret Manager name | Environment variable |
|---|---|
| `filatex-azure-tenant-id` | `AZURE_TENANT_ID` |
| `filatex-azure-client-id` | `AZURE_CLIENT_ID` |
| `filatex-azure-client-secret` | `AZURE_CLIENT_SECRET` |
| `filatex-onedrive-drive-id` | `ONEDRIVE_DRIVE_ID` |

Then grant the Cloud Run service account access:
```bash
# Get the default compute service account email
SA=$(gcloud iam service-accounts list \
  --filter="displayName:Compute Engine default" \
  --format="value(email)")

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SA}" \
  --role=roles/secretmanager.secretAccessor
```

---

## 2 — Deploy

### Option A — Local build + deploy (fastest iteration)
```bash
./deploy.sh all
```
Builds image locally, pushes to Artifact Registry, then deploys to Cloud Run.

### Option B — Cloud Build (CI/CD)
```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=europe-west1,_SERVICE=filatex-dashboard
```
Builds and deploys entirely in the cloud. Use this for automated pipelines.

### Option C — Connect a trigger to GitHub
In the Cloud Console → Cloud Build → Triggers, connect the repo and point to `cloudbuild.yaml`. Every push to `main` will auto-deploy.

---

## 3 — View the deployed URL

```bash
gcloud run services describe filatex-dashboard \
  --region=europe-west1 \
  --format="value(status.url)"
```

---

## 4 — View logs

```bash
# Live tail
gcloud run services logs tail filatex-dashboard --region=europe-west1

# Or in Cloud Logging
gcloud logging read \
  'resource.type="cloud_run_revision" resource.labels.service_name="filatex-dashboard"' \
  --limit=50 --format=json
```

---

## 5 — Custom domain (optional)

```bash
# Map a verified domain
gcloud run domain-mappings create \
  --service=filatex-dashboard \
  --domain=dashboard.filatex.com \
  --region=europe-west1
```

Then add the CNAME record shown in the output to your DNS provider.

---

## Environment variables reference

| Variable | Where to set | Sensitive? |
|---|---|---|
| `AZURE_TENANT_ID` | Secret Manager | Yes |
| `AZURE_CLIENT_ID` | Secret Manager | Yes |
| `AZURE_CLIENT_SECRET` | Secret Manager | Yes |
| `ONEDRIVE_DRIVE_ID` | Secret Manager | Yes |
| `DATA_BASE_PATH` | `--set-env-vars` | No |
| `LOG_LEVEL` | `--set-env-vars` | No |
| `TTL_*` | `--set-env-vars` | No |
| `GUNICORN_WORKERS` | `--set-env-vars` | No |
| `GUNICORN_THREADS` | `--set-env-vars` | No |
| `GUNICORN_TIMEOUT` | `--set-env-vars` | No |

See `.env.example` for all variables and their default values.

---

## Updating a secret

```bash
echo "new-secret-value" | gcloud secrets versions add filatex-azure-client-secret \
  --data-file=- --project=YOUR_PROJECT_ID
```

Cloud Run picks up the new version on the next container start (or redeploy).
