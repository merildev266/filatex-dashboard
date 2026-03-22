"""
config.py — Centralized configuration loaded from environment variables.

All Azure/SharePoint settings and TTL values are read from .env (via python-dotenv).
Import this module early (before sharepoint_client or cache) to ensure env vars are set.
"""
import os
import logging
from dotenv import load_dotenv

# Load .env file if present (no-op in production where vars are injected directly)
load_dotenv()

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Azure / Microsoft Graph
# ---------------------------------------------------------------------------

AZURE_TENANT_ID: str = os.environ.get("AZURE_TENANT_ID", "")
AZURE_CLIENT_ID: str = os.environ.get("AZURE_CLIENT_ID", "")
AZURE_CLIENT_SECRET: str = os.environ.get("AZURE_CLIENT_SECRET", "")

# OneDrive drive ID (from /sites/{site-id}/drives)
ONEDRIVE_DRIVE_ID: str = os.environ.get("ONEDRIVE_DRIVE_ID", "")

# Base path inside the drive — all relative paths are appended to this
DATA_BASE_PATH: str = os.environ.get(
    "DATA_BASE_PATH",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
)

# ---------------------------------------------------------------------------
# TTL settings (seconds) — override per environment via .env
# ---------------------------------------------------------------------------

TTL_HFO_SITES: int = int(os.environ.get("TTL_HFO_SITES", 3600))
TTL_ENR_SITES: int = int(os.environ.get("TTL_ENR_SITES", 3600))
TTL_HFO_PROJECTS: int = int(os.environ.get("TTL_HFO_PROJECTS", 1800))
TTL_ENR_PROJECTS: int = int(os.environ.get("TTL_ENR_PROJECTS", 900))
TTL_CAPEX: int = int(os.environ.get("TTL_CAPEX", 3600))
TTL_REPORTING: int = int(os.environ.get("TTL_REPORTING", 900))
TTL_INVESTMENTS: int = int(os.environ.get("TTL_INVESTMENTS", 900))

# Historical monthly data — past months don't change, so cache aggressively
TTL_HISTORICAL_MONTH: int = int(os.environ.get("TTL_HISTORICAL_MONTH", 86400))

# Default TTL used when no specific one is configured
TTL_DEFAULT: int = int(os.environ.get("TTL_DEFAULT", 900))

# How many seconds before expiry the background refresh worker pre-warms a key
REFRESH_AHEAD_SECONDS: int = int(os.environ.get("REFRESH_AHEAD_SECONDS", 120))

# How often the background worker checks for soon-to-expire keys (seconds)
REFRESH_WORKER_INTERVAL: int = int(os.environ.get("REFRESH_WORKER_INTERVAL", 60))


def validate() -> list[str]:
    """Return a list of missing required configuration keys (empty = OK)."""
    required = {
        "AZURE_TENANT_ID": AZURE_TENANT_ID,
        "AZURE_CLIENT_ID": AZURE_CLIENT_ID,
        "AZURE_CLIENT_SECRET": AZURE_CLIENT_SECRET,
        "ONEDRIVE_DRIVE_ID": ONEDRIVE_DRIVE_ID,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        log.warning("Missing required config keys: %s", ", ".join(missing))
    return missing
