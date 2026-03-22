"""
api_data.py — Flask Blueprint exposing all /api/* endpoints.
All GET endpoints use the cache from Phase 1. POST endpoints write back to SharePoint.
"""
import logging
import os
from flask import Blueprint, jsonify, request

import cache
import sharepoint_client as sp
import config
from utils import find_latest_s_sheet, ss

log = logging.getLogger(__name__)

api = Blueprint("api", __name__, url_prefix="/api")


def _ttl(key: str) -> int:
    return int(os.environ.get(f"TTL_{key}", config.TTL_DEFAULT))


def _safe_load(cache_key: str, ttl_key: str, loader):
    """Load from cache or call loader, returning (data, status_code)."""
    try:
        data = cache.get_or_load(cache_key, _ttl(ttl_key), loader)
        return jsonify(data), 200
    except Exception as exc:
        err_str = str(exc)
        if "423" in err_str or "locked" in err_str.lower():
            return jsonify({"error": "Fichier verrouill\u00e9 dans Excel \u2014 r\u00e9essayez plus tard."}), 423
        if any(code in err_str for code in ["503", "502", "504", "ConnectionError", "Timeout"]):
            return jsonify({"error": "SharePoint inaccessible \u2014 r\u00e9essayez dans quelques instants.", "detail": err_str}), 503
        log.exception("API error for cache key=%s", cache_key)
        return jsonify({"error": str(exc)}), 500


# ── GET endpoints ──

@api.route("/hfo-sites")
def get_hfo_sites():
    from parsers import hfo
    return _safe_load("hfo_sites", "HFO_SITES", hfo.build_all_sites)


@api.route("/enr-sites")
def get_enr_sites():
    from parsers import enr_sites
    return _safe_load("enr_sites", "ENR_SITES", enr_sites.build)


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
