"""
parsers/reporting.py — ENR weekly reporting parser.
Reads Weekly_EnR_Avancement.xlsx + Weekly_EnR_Paiements.xlsx from SharePoint.
Exact port of generate_reporting.py.
"""
import logging
import re
from datetime import datetime

import sharepoint_client as sp
from utils import find_latest_s_sheet, ss

log = logging.getLogger(__name__)

_AVANCEMENT_FILE = "01_Energy/Projet/EnR/Weekly_Report/Weekly_EnR_Avancement.xlsx"
_PAIEMENTS_FILE = "01_Energy/Projet/EnR/Weekly_Report/Weekly_EnR_Paiements.xlsx"


def _safe_num(v, default=0):
    if v is None:
        return default
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def _find_all_filled_sheets(wb) -> list:
    """Find all S## sheets with real project data (cols 6-15)."""
    filled = []
    for sn in wb.sheetnames:
        m = re.match(r"^S(\d{2})$", sn)
        if not m:
            continue
        ws = wb[sn]
        has_data = False
        for row in range(9, min(ws.max_row + 1, 35)):
            for col in range(6, 16):
                v = ws.cell(row, col).value
                if v is not None and str(v).strip():
                    has_data = True
                    break
            if has_data:
                break
        if has_data:
            filled.append(sn)
    return filled


def _extract_week_date(ws) -> str:
    for cell_ref in ["G3", "E3", "E2"]:
        row = int(cell_ref[1:])
        col_letter = cell_ref[0]
        col = ord(col_letter) - ord("A") + 1
        val = ws.cell(row, col).value
        if val is None:
            continue
        if hasattr(val, "strftime"):
            return val.strftime("%d/%m/%Y")
        s = ss(val)
        m = re.search(r"(\d{2}/\d{2}/\d{4})", s)
        if m:
            return m.group(1)
    return ""


def _read_sheet_projects(ws) -> list:
    projects = []
    for row in range(9, ws.max_row + 1):
        pid = ss(ws.cell(row, 1).value)
        nom = ss(ws.cell(row, 2).value)
        if not pid or not nom:
            continue
        projects.append({
            "id": pid,
            "projet": nom,
            "responsable": ss(ws.cell(row, 3).value),
            "type": ss(ws.cell(row, 4).value),
            "puissance": _safe_num(ws.cell(row, 5).value),
            "phase": ss(ws.cell(row, 6).value),
            "avancement": _safe_num(ws.cell(row, 7).value),
            "glissement": int(_safe_num(ws.cell(row, 8).value)),
            "statut_eng": ss(ws.cell(row, 9).value),
            "statut_const": ss(ws.cell(row, 10).value),
            "statut_permis": "",
            "epc": ss(ws.cell(row, 11).value),
            "date_mes_prevue": ss(ws.cell(row, 12).value),
            "date_mes_revisee": "",
            "blocages": ss(ws.cell(row, 13).value),
            "actions_s1": ss(ws.cell(row, 14).value),
            "actions": ss(ws.cell(row, 15).value),
            "commentaires_dg": ss(ws.cell(row, 16).value),
            "reponse": ss(ws.cell(row, 17).value),
        })
    return projects


def _read_all_weeks(wb):
    """Returns (latest_sheet, weeks_data)."""
    filled_sheets = _find_all_filled_sheets(wb)
    if not filled_sheets:
        return None, {}

    weeks_data = {}
    latest_sheet = None
    latest_num = 0

    if "Config" in wb.sheetnames:
        cfg_val = wb["Config"]["B4"].value
        if cfg_val and re.match(r"^S\d{2}$", str(cfg_val)):
            latest_sheet = str(cfg_val)
            latest_num = int(str(cfg_val)[1:])

    for sn in filled_sheets:
        ws = wb[sn]
        week_date = _extract_week_date(ws)
        projects = _read_sheet_projects(ws)
        num = int(sn[1:])
        weeks_data[sn] = {"sheet": sn, "week": week_date, "projects": projects}
        if not latest_sheet and num > latest_num:
            latest_num = num
            latest_sheet = sn

    if not latest_sheet and filled_sheets:
        latest_sheet = filled_sheets[-1]

    return latest_sheet, weeks_data


def _read_paiements(wb_or_path) -> list:
    """Read payments from a workbook. Tries PAIEMENT sheet, then Paiements."""
    payments = []

    ws = None
    start_row = 5

    if "PAIEMENT" in wb_or_path.sheetnames:
        ws = wb_or_path["PAIEMENT"]
        start_row = 3
        is_new = True
    else:
        for sn in ["Paiements", "Paiement"]:
            if sn in wb_or_path.sheetnames:
                ws = wb_or_path[sn]
                is_new = False
                break
        # Try latest S## sheet
        if ws is None:
            latest = find_latest_s_sheet(wb_or_path)
            if latest and latest in wb_or_path.sheetnames:
                ws = wb_or_path[latest]
                is_new = False

    if ws is None:
        return payments

    col_offset = 1 if is_new else 0

    for row in range(start_row, ws.max_row + 1):
        pid = ss(ws.cell(row, 1).value)
        projet = ss(ws.cell(row, 2 + col_offset).value)
        if not pid and not projet:
            continue
        desc_val = ss(ws.cell(row, 5 + col_offset).value)
        if desc_val.upper().startswith("TOTAL"):
            continue

        payments.append({
            "id_projet": pid,
            "projet": projet,
            "contractant": ss(ws.cell(row, 3 + col_offset).value),
            "prestation": ss(ws.cell(row, 4 + col_offset).value),
            "description": desc_val,
            "montant": _safe_num(ws.cell(row, 7 if is_new else 6).value),
            "devise": ss(ws.cell(row, 7 + col_offset).value).upper() if not is_new else "USD",
            "echeance": ss(ws.cell(row, 8 + col_offset).value),
            "statut": ss(ws.cell(row, 9 + col_offset).value),
            "actions": ss(ws.cell(row, 10 + col_offset).value),
        })
    return payments


def build() -> dict:
    """Return dict with REPORTING_ENR key."""
    # Load avancement workbook
    try:
        wb_av = sp.get_workbook(_AVANCEMENT_FILE, read_only=False)
    except Exception as exc:
        log.error("Reporting: avancement file failed: %s", exc)
        raise

    latest_sheet, weeks_data = _read_all_weeks(wb_av)

    # Try PAIEMENT sheet in avancement file first
    payments = []
    if "PAIEMENT" in wb_av.sheetnames:
        payments = _read_paiements(wb_av)

    wb_av.close()

    # Fallback to separate paiements file
    if not payments:
        try:
            wb_pay = sp.get_workbook(_PAIEMENTS_FILE, read_only=False)
            payments = _read_paiements(wb_pay)
            wb_pay.close()
        except Exception as exc:
            log.warning("Reporting: paiements file failed: %s", exc)

    latest_data = weeks_data.get(latest_sheet, {})
    data = {
        "week": latest_data.get("week", ""),
        "currentSheet": latest_sheet or "",
        "generated": datetime.now().isoformat(),
        "projects": latest_data.get("projects", []),
        "payments": payments,
        "weeks": weeks_data,
    }
    log.info("Reporting: latest=%s, %d weeks, %d projects, %d payments",
             latest_sheet, len(weeks_data), len(data["projects"]), len(payments))
    return {"REPORTING_ENR": data}
