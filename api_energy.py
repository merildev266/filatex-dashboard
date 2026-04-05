"""
api_energy.py — Flask Blueprint exposing Energy API endpoints.

All GET endpoints use the TTL cache. Data is read from local Excel files
(OneDrive sync) — no SharePoint Graph API needed.
"""
import logging
import time
from flask import Blueprint, jsonify

import cache
from data_loader import build_site_data

log = logging.getLogger(__name__)

api = Blueprint("api_energy", __name__, url_prefix="/api/energy")

# Cache TTLs (seconds)
TTL_HFO_SITES = 900       # 15 min
TTL_ENR_SITES = 900        # 15 min
TTL_HFO_PROJECTS = 900     # 15 min
TTL_ENR_PROJECTS = 900     # 15 min


def _safe_load(cache_key, ttl, loader):
    """Load from cache, return JSON response. Falls back to stale data on error."""
    t0 = time.monotonic()
    try:
        data = cache.get_or_load(cache_key, ttl, loader)
        return jsonify(data), 200
    except Exception as exc:
        elapsed = time.monotonic() - t0
        log.warning("API error: key=%s elapsed=%.2fs error=%s", cache_key, elapsed, exc)
        stale = cache.get_stale(cache_key)
        if stale is not None:
            log.info("Returning stale data for key=%s", cache_key)
            return jsonify(stale), 200
        return jsonify({"error": str(exc)}), 500


def _build_hfo_sites():
    """Build all 4 HFO sites data from local Excel files."""
    js_var_map = {
        "tamatave": "TAMATAVE_LIVE",
        "diego": "DIEGO_LIVE",
        "majunga": "MAJUNGA_LIVE",
        "tulear": "TULEAR_LIVE",
    }
    result = {}
    for site_key, js_var in js_var_map.items():
        try:
            data = build_site_data(site_key)
            if data:
                result[js_var] = data
                log.info("HFO %s: status=%s, mw=%s", site_key, data.get("status"), data.get("mw"))
            else:
                log.warning("HFO %s: no data", site_key)
        except Exception as exc:
            log.error("HFO %s: build failed: %s", site_key, exc)
    return result


def _build_enr_sites():
    """Build ENR sites data from local Excel files."""
    from generate_enr_data import build_enr_sites
    return build_enr_sites()


def _build_hfo_projects():
    """Build HFO projects data from local Excel file."""
    from generate_hfo_projects import build_hfo_projects
    return build_hfo_projects()


def _build_enr_projects():
    """Build ENR projects data from local Excel files."""
    from generate_enr_projects import build_enr_projects
    return build_enr_projects()


# ── GET endpoints ──

@api.route("/hfo-sites")
def get_hfo_sites():
    return _safe_load("hfo_sites", TTL_HFO_SITES, _build_hfo_sites)


@api.route("/enr-sites")
def get_enr_sites():
    return _safe_load("enr_sites", TTL_ENR_SITES, _build_enr_sites)


@api.route("/hfo-projects")
def get_hfo_projects():
    return _safe_load("hfo_projects", TTL_HFO_PROJECTS, _build_hfo_projects)


@api.route("/enr-projects")
def get_enr_projects():
    return _safe_load("enr_projects", TTL_ENR_PROJECTS, _build_enr_projects)


# ── POST: cache management ──

@api.route("/cache/refresh", methods=["POST"])
def refresh_cache():
    """Invalidate all energy cache keys — next GET will reload from Excel."""
    cache.invalidate("hfo_sites")
    cache.invalidate("enr_sites")
    cache.invalidate("hfo_projects")
    cache.invalidate("enr_projects")
    return jsonify({"ok": True, "invalidated": ["hfo_sites", "enr_sites", "hfo_projects", "enr_projects"]})
