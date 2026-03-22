"""
api_data.py — Flask Blueprint exposing all /api/* endpoints.
All GET endpoints use the cache from Phase 1. POST endpoints write back to SharePoint.
"""
import logging
import os
import time
from datetime import datetime
from flask import Blueprint, jsonify, request

import cache
import sharepoint_client as sp
import config
from utils import find_latest_s_sheet, ss

log = logging.getLogger(__name__)

api = Blueprint("api", __name__, url_prefix="/api")


def _ttl(key: str) -> int:
    return int(os.environ.get(f"TTL_{key}", config.TTL_DEFAULT))


def _safe_load(cache_key: str, ttl_key: str, loader, ttl_override: int | None = None):
    """Load from cache or call loader, returning a Flask response tuple.

    Error handling matrix:
    - Token expiry:        MSAL auto-refreshes; returns 503 if auth fails.
    - File locked (423):   Returns 423 with clear message (write-back only —
                           read-only downloads are unaffected).
    - File not found (404):Returns stale cached data if available, else 404.
    - Parse error:         Logs warning; returns stale data or 500.
    - Cold cache:          Blocks synchronously on first call (get_or_load).
    - SharePoint down:     Returns stale data if available, else 503.

    Args:
        cache_key:    Key used to store/retrieve from cache.
        ttl_key:      Config key (e.g. 'HFO_SITES') — used when ttl_override is None.
        loader:       Zero-argument callable that fetches the data.
        ttl_override: Explicit TTL in seconds; bypasses ttl_key lookup when provided.
    """
    t0 = time.monotonic()
    try:
        ttl = ttl_override if ttl_override is not None else _ttl(ttl_key)
        data = cache.get_or_load(cache_key, ttl, loader)
        log.debug("API load OK: key=%s elapsed=%.2fs", cache_key, time.monotonic() - t0)
        return jsonify(data), 200
    except Exception as exc:
        elapsed = time.monotonic() - t0
        err_str = str(exc)
        log.warning("API load error: key=%s elapsed=%.2fs error=%s", cache_key, elapsed, err_str)

        # ── Stale cache fallback ──────────────────────────────────────────
        # Return the last known good value rather than an error when possible.
        stale = cache.get_stale(cache_key)
        if stale is not None:
            log.info("Returning stale cached data for key=%s", cache_key)
            return jsonify(stale), 200

        # ── Error classification (no stale data available) ────────────────
        if "423" in err_str or "locked" in err_str.lower():
            return jsonify({"error": "Fichier verrouill\u00e9 dans Excel \u2014 r\u00e9essayez plus tard."}), 423

        if "404" in err_str or "not found" in err_str.lower():
            return jsonify({"error": "file_not_found", "path": cache_key}), 404

        # MSAL auth failure → 503 (transient, retry later)
        if "msal auth failed" in err_str.lower() or (
            "access_token" not in err_str and "auth" in err_str.lower()
        ):
            return jsonify({
                "error": "Authentification SharePoint \u00e9chou\u00e9e \u2014 r\u00e9essayez dans quelques instants.",
                "detail": err_str,
            }), 503

        # Network / SharePoint unavailable → 503
        if any(code in err_str for code in ["503", "502", "504", "ConnectionError", "Timeout"]):
            return jsonify({
                "error": "SharePoint inaccessible \u2014 r\u00e9essayez dans quelques instants.",
                "detail": err_str,
            }), 503

        log.exception("API error for cache key=%s", cache_key)
        return jsonify({"error": str(exc)}), 500


def _parse_month_param(month_str: str | None):
    """Parse and validate the ?month= query param. Returns (month_int, error_response)."""
    if not month_str:
        return None, None
    try:
        month = int(month_str)
    except ValueError:
        return None, (jsonify({"error": "Paramètre 'month' invalide — entier 1–12 attendu."}), 400)
    if not 1 <= month <= 12:
        return None, (jsonify({"error": "Paramètre 'month' invalide — doit être entre 1 et 12."}), 400)
    return month, None


# ── GET endpoints ──

@api.route("/hfo-sites")
def get_hfo_sites():
    """
    GET /api/hfo-sites              → all available months (current behaviour)
    GET /api/hfo-sites?month=3      → March data only (cached 24 h)
    GET /api/hfo-sites?all_months=true → explicit all-months request
    """
    from parsers import hfo

    month_str = request.args.get("month")
    all_months = request.args.get("all_months", "").lower() in ("true", "1", "yes")

    if month_str:
        month, err = _parse_month_param(month_str)
        if err:
            return err
        return _safe_load(
            f"hfo_sites_m{month:02d}",
            "HFO_SITES",
            lambda: hfo.build_all_sites(month=month),
            ttl_override=config.TTL_HISTORICAL_MONTH,
        )

    if all_months:
        return _safe_load("hfo_sites_all", "HFO_SITES", hfo.build_all_sites)

    return _safe_load("hfo_sites", "HFO_SITES", hfo.build_all_sites)


@api.route("/enr-sites")
def get_enr_sites():
    """
    GET /api/enr-sites              → all available months (current behaviour)
    GET /api/enr-sites?month=3      → March data only (cached 24 h)
    GET /api/enr-sites?all_months=true → explicit all-months request
    """
    from parsers import enr_sites

    month_str = request.args.get("month")
    all_months = request.args.get("all_months", "").lower() in ("true", "1", "yes")

    if month_str:
        month, err = _parse_month_param(month_str)
        if err:
            return err
        return _safe_load(
            f"enr_sites_m{month:02d}",
            "ENR_SITES",
            lambda: enr_sites.build(month=month),
            ttl_override=config.TTL_HISTORICAL_MONTH,
        )

    if all_months:
        return _safe_load("enr_sites_all", "ENR_SITES", enr_sites.build)

    return _safe_load("enr_sites", "ENR_SITES", enr_sites.build)


@api.route("/available-months")
def get_available_months():
    """
    GET /api/available-months → lists which monthly files exist per site.

    Response shape:
    {
        "year": 2026,
        "hfo":  {"tamatave": [1,2,3], "diego": [1,2], ...},
        "enr":  {"DIE": [1,2,3], "TMM": [1,2,3], "MJN": [1,2,3]}
    }
    """
    from parsers import hfo, enr_sites

    def _load():
        year = datetime.now().year
        hfo_result = hfo.list_available_months()
        enr_result = enr_sites.list_available_months()
        return {
            "year": year,
            "hfo": hfo_result.get("hfo", {}),
            "enr": enr_result.get("enr", {}),
        }

    return _safe_load("available_months", "HFO_SITES", _load)


@api.route("/hfo-projects")
def get_hfo_projects():
    from parsers import hfo_projects
    return _safe_load("hfo_projects", "HFO_PROJECTS", hfo_projects.build)


@api.route("/enr-projects")
def get_enr_projects():
    from parsers import enr_projects
    return _safe_load("enr_projects", "ENR_PROJECTS", enr_projects.build)


@api.route("/capex")
def get_capex():
    from parsers import capex_parser
    return _safe_load("capex", "CAPEX", capex_parser.build)


@api.route("/enr-reporting")
def get_enr_reporting():
    from parsers import reporting
    return _safe_load("enr_reporting", "REPORTING", reporting.build)


# ── POST: comment write-back ──

@api.route("/comment/enr", methods=["POST"])
def comment_enr():
    body = request.get_json() or {}
    pid = body.get("projectId")
    comment = body.get("comment")
    reponse = body.get("reponse")

    if not pid:
        return jsonify({"error": "projectId required"}), 400
    if comment is None and reponse is None:
        return jsonify({"error": "comment or reponse required"}), 400

    path = "01_Energy/Projet/EnR/Weekly_Report/Weekly_EnR_Avancement.xlsx"
    try:
        wb = sp.get_workbook(path, read_only=False)
        sheet_name = find_latest_s_sheet(wb)
        if not sheet_name:
            return jsonify({"error": "No active sheet found"}), 404

        ws = wb[sheet_name]
        for r in range(6, ws.max_row + 1):
            if ss(ws.cell(r, 1).value) == pid:
                if comment is not None:
                    ws.cell(r, 16).value = comment.strip()  # col P
                if reponse is not None:
                    ws.cell(r, 17).value = reponse.strip()   # col Q
                sp.put_workbook(wb, path)
                cache.invalidate("enr_reporting")
                cache.invalidate("enr_projects")
                return jsonify({"ok": True, "sheet": sheet_name})
        return jsonify({"error": f"Project {pid} not found"}), 404

    except Exception as exc:
        err = str(exc)
        if "423" in err or "locked" in err.lower():
            return jsonify({"error": "Fichier ouvert dans Excel \u2014 fermez-le et r\u00e9essayez."}), 423
        log.exception("comment/enr error")
        return jsonify({"error": err}), 500


@api.route("/comment/investments", methods=["POST"])
def comment_investments():
    body = request.get_json() or {}
    pid = body.get("projectId")
    comment = body.get("comment")
    reponse = body.get("reponse")

    if not pid:
        return jsonify({"error": "projectId required"}), 400
    if comment is None and reponse is None:
        return jsonify({"error": "comment or reponse required"}), 400

    # Try primary file, then fallback
    wb = None
    chosen_path = None
    for fname in ["Weekly_Investments_Avancement.xlsx", "Weekly_Investments_Avancement_v2.xlsx"]:
        path = f"03_ Investments/Reporting/{fname}"
        try:
            wb = sp.get_workbook(path, read_only=False)
            chosen_path = path
            break
        except Exception:
            continue

    if not wb:
        return jsonify({"error": "Investments weekly file not found on SharePoint"}), 404

    try:
        sheet_name = find_latest_s_sheet(wb)
        if not sheet_name:
            return jsonify({"error": "No active sheet found"}), 404

        ws = wb[sheet_name]
        for r in range(6, ws.max_row + 1):
            if ss(ws.cell(r, 1).value) == pid:
                if comment is not None:
                    ws.cell(r, 10).value = comment.strip()   # col J
                if reponse is not None:
                    ws.cell(r, 11).value = reponse.strip()   # col K
                sp.put_workbook(wb, chosen_path)
                cache.invalidate("investments")
                return jsonify({"ok": True, "sheet": sheet_name})
        return jsonify({"error": f"Project {pid} not found"}), 404

    except Exception as exc:
        err = str(exc)
        if "423" in err or "locked" in err.lower():
            return jsonify({"error": "Fichier ouvert dans Excel \u2014 fermez-le et r\u00e9essayez."}), 423
        log.exception("comment/investments error")
        return jsonify({"error": err}), 500


# ── Admin: cache invalidation ──

@api.route("/cache/invalidate", methods=["POST"])
def invalidate_cache():
    body = request.get_json() or {}
    key = body.get("key", "all")
    if key == "all":
        cache.invalidate()  # no argument = clear all
    else:
        cache.invalidate(key)
    return jsonify({"ok": True, "invalidated": key})
