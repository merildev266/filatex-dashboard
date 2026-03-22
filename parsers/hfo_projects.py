"""
parsers/hfo_projects.py — HFO projects parser.
Reads LISTE PROJET 260217.xlsx from SharePoint and returns HFO_PROJECTS dict.
"""
import logging
import math
from datetime import date, datetime

import sharepoint_client as sp
from utils import sf, sd, ss

log = logging.getLogger(__name__)

_FILE = "01_Energy/Projet/HFO/LISTE PROJET 260217.xlsx"

# Column indices (0-based), header row is row index 1 (row 2 in Excel, since header=1 in pandas)
# In openpyxl: sheet has header on row 2, data from row 3
_HEADER_ROW = 2  # 1-based row with column headers
_DATA_START = 3  # 1-based first data row


def _categorize(name: str) -> str:
    p = name.lower()
    if "overhaul" in p:
        return "overhaul"
    if "remise en service" in p or "remplacement" in p:
        return "remise"
    if "maintenance" in p:
        return "maintenance"
    if "scada" in p:
        return "scada"
    if "installation" in p or "cooling" in p or "calorifusage" in p:
        return "installation"
    return "autre"


def _status_from_dtg(dtg) -> str:
    if dtg is None:
        return "indefini"
    try:
        v = float(dtg)
        if math.isnan(v) or v < -1000:
            return "indefini"
        if v <= 0:
            return "termine"
        if v <= 30:
            return "urgent"
        return "en_cours"
    except (TypeError, ValueError):
        return "indefini"


def _safe_date(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    # Keep descriptive text (like "Projet en cours de validation")
    if len(s) >= 10 and s[4:5] == "-" and s[7:8] == "-":
        return s[:10]
    if s and not s[:4].isdigit():
        return s  # Keep as text
    return None


def build() -> dict:
    """Return dict with HFO_PROJECTS key."""
    try:
        wb = sp.get_workbook(_FILE, read_only=True)
    except Exception as exc:
        log.error("HFO projects: failed to download %s: %s", _FILE, exc)
        raise

    ws = wb.active

    # Detect header columns from row 2
    headers = {}
    for cell in ws[_HEADER_ROW]:
        if cell.value:
            h = str(cell.value).strip()
            headers[h] = cell.column

    def col(name):
        return headers.get(name)

    site_col = col("SITE") or 1
    projet_col = col("PROJET") or 2
    moteur_col = col("MOTEUR") or 3
    dl_init_col = col("DL initial") or 4
    dl_revu_col = col("DL revu") or 5
    exec_col = col("Date d'execution") or 6
    ecart_col = col("Ecart (Jour)") or 7
    dtg_col = col("Day to go") or 8
    comment_col = col("COMMENTAIRE") or 9
    action_col = col("Action") or 10
    resp_col = col("Resp") or 11

    projects = []
    for row in ws.iter_rows(min_row=_DATA_START, values_only=True):
        site = ss(row[site_col - 1] if site_col <= len(row) else None)
        projet = ss(row[projet_col - 1] if projet_col <= len(row) else None)
        if not site or not projet:
            continue

        moteur_raw = row[moteur_col - 1] if moteur_col <= len(row) else None
        dl_init_raw = row[dl_init_col - 1] if dl_init_col <= len(row) else None
        dl_revu_raw = row[dl_revu_col - 1] if dl_revu_col <= len(row) else None
        exec_raw = row[exec_col - 1] if exec_col <= len(row) else None
        ecart_raw = row[ecart_col - 1] if ecart_col <= len(row) else None
        dtg_raw = row[dtg_col - 1] if dtg_col <= len(row) else None
        comment_raw = row[comment_col - 1] if comment_col <= len(row) else None
        action_raw = row[action_col - 1] if action_col <= len(row) else None
        resp_raw = row[resp_col - 1] if resp_col <= len(row) else None

        moteur_str = ss(moteur_raw) or None
        ecart_val = None
        if ecart_raw is not None:
            try:
                v = float(ecart_raw)
                if abs(v) < 10000:
                    ecart_val = int(v)
            except (TypeError, ValueError):
                pass
        dtg_val = None
        if dtg_raw is not None:
            try:
                v = float(dtg_raw)
                if abs(v) < 10000:
                    dtg_val = int(v)
            except (TypeError, ValueError):
                pass

        cat = _categorize(projet)
        status = _status_from_dtg(dtg_val)

        comment_str = ss(comment_raw)
        action_str = ss(action_raw)
        resp_str = ss(resp_raw)

        projects.append({
            "site": site,
            "projet": projet,
            "moteur": moteur_str,
            "categorie": cat,
            "status": status,
            "dlInit": _safe_date(dl_init_raw),
            "dlRevu": _safe_date(dl_revu_raw),
            "dateExec": _safe_date(exec_raw),
            "ecartJours": ecart_val,
            "dayToGo": dtg_val,
            "commentaire": comment_str if comment_str and comment_str != "nan" else None,
            "action": action_str if action_str and action_str != "nan" else None,
            "resp": resp_str if resp_str and resp_str != "nan" else None,
        })

    wb.close()

    sites = sorted(set(p["site"] for p in projects))
    by_site = {}
    for s in sites:
        sp_list = [p for p in projects if p["site"] == s]
        by_site[s] = {
            "total": len(sp_list),
            "overhaul": sum(1 for p in sp_list if p["categorie"] == "overhaul"),
            "urgent": sum(1 for p in sp_list if p["status"] == "urgent"),
            "enCours": sum(1 for p in sp_list if p["status"] == "en_cours"),
        }

    total = len(projects)
    data = {
        "total": total,
        "overhauls": sum(1 for p in projects if p["categorie"] == "overhaul"),
        "urgents": sum(1 for p in projects if p["status"] == "urgent"),
        "enCours": sum(1 for p in projects if p["status"] == "en_cours"),
        "termines": sum(1 for p in projects if p["status"] == "termine"),
        "sites": sites,
        "bySite": by_site,
        "projects": projects,
    }
    log.info("HFO projects: %d total, %d urgents", total, data["urgents"])
    return {"HFO_PROJECTS": data}
