"""Generate reporting_data.js from Weekly EnR Excel files (52-sheet format)."""
import json, os, sys, re
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

BASE = r"C:\Users\Meril\OneDrive - GROUPE FILATEX\Fichiers de DOSSIER DASHBOARD - Data_Dashbords\01_Energy\Projet\EnR"
AVANCEMENT_FILE = os.path.join(BASE, "Weekly_Report", "Weekly_EnR_Avancement.xlsx")
PAIEMENTS_FILE = os.path.join(BASE, "Weekly_Report", "Weekly_EnR_Paiements.xlsx")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reporting_data.js")


def safe_str(v):
    if v is None:
        return ""
    return str(v).strip()


def safe_num(v, default=0):
    if v is None:
        return default
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def _find_latest_sheet(wb):
    """Find the latest filled S## sheet in a workbook."""
    if "Config" in wb.sheetnames:
        cfg_val = wb["Config"]["B4"].value
        if cfg_val and re.match(r"^S\d{2}$", str(cfg_val)):
            return str(cfg_val)

    latest = None
    for sn in wb.sheetnames:
        m = re.match(r"^S(\d{2})$", sn)
        if not m:
            continue
        ws = wb[sn]
        has_data = False
        for r in range(9, min(ws.max_row + 1, 35)):
            for c in range(6, min(ws.max_column + 1, 18)):
                v = ws.cell(r, c).value
                if v is not None and str(v).strip():
                    has_data = True
                    break
            if has_data:
                break
        if has_data:
            num = int(m.group(1))
            if latest is None or num > latest:
                latest = num
    return f"S{latest:02d}" if latest else None


def read_avancement():
    if not os.path.exists(AVANCEMENT_FILE):
        print(f"WARN: {AVANCEMENT_FILE} not found")
        return None, []

    wb = openpyxl.load_workbook(AVANCEMENT_FILE, data_only=True)

    # Try new 52-sheet format first
    sheet_name = _find_latest_sheet(wb)
    if sheet_name and sheet_name in wb.sheetnames:
        return _read_avancement_weekly(wb, sheet_name)

    # Fallback to old single-sheet format
    if "Avancement Projets" in wb.sheetnames:
        return _read_avancement_old(wb)

    wb.close()
    print("WARN: No suitable sheet found in avancement file")
    return None, []


def _read_avancement_weekly(wb, sheet_name):
    """Read from new 52-sheet S## format.
    Column layout: A=ID, B=Projet, C=Resp, D=Type, E=MWc, F=Phase,
    G=Avancement, H=Glissement, I=Statut Etudes, J=Statut Construction,
    K=EPC, L=COD Prevue, M=Blocages, N=Actions S-1, O=Actions Semaine,
    P=Commentaires DG, Q=Reponse
    Headers in row 8, data from row 9.
    """
    ws = wb[sheet_name]

    # Extract week date — try E3 (date), G3 (end date), E2 (date)
    week_str = ""
    for cell_ref in ["G3", "E3", "E2"]:
        val = ws[cell_ref].value
        if val is None:
            continue
        if hasattr(val, 'strftime'):
            week_str = val.strftime("%d/%m/%Y")
            break
        s = safe_str(val)
        date_match = re.search(r"(\d{2}/\d{2}/\d{4})", s)
        if date_match:
            week_str = date_match.group(1)
            break

    projects = []
    for row in range(9, ws.max_row + 1):
        pid = safe_str(ws.cell(row, 1).value)   # A = ID
        nom = safe_str(ws.cell(row, 2).value)    # B = Projet
        if not pid or not nom:
            continue

        projects.append({
            "id": pid,
            "projet": nom,
            "responsable": safe_str(ws.cell(row, 3).value),   # C
            "type": safe_str(ws.cell(row, 4).value),           # D
            "puissance": safe_num(ws.cell(row, 5).value),      # E
            "phase": safe_str(ws.cell(row, 6).value),          # F
            "avancement": safe_num(ws.cell(row, 7).value),     # G
            "glissement": int(safe_num(ws.cell(row, 8).value)),# H
            "statut_eng": safe_str(ws.cell(row, 9).value),     # I
            "statut_const": safe_str(ws.cell(row, 10).value),  # J
            "statut_permis": "",                                # not in new format
            "epc": safe_str(ws.cell(row, 11).value),           # K
            "date_mes_prevue": safe_str(ws.cell(row, 12).value),# L
            "date_mes_revisee": "",                              # not in new format
            "blocages": safe_str(ws.cell(row, 13).value),      # M
            "actions_s1": safe_str(ws.cell(row, 14).value),    # N
            "actions": safe_str(ws.cell(row, 15).value),       # O
            "commentaires_dg": safe_str(ws.cell(row, 16).value),# P
            "reponse": safe_str(ws.cell(row, 17).value),       # Q
        })

    wb.close()
    return week_str, projects


def _read_avancement_old(wb):
    """Read from old single-sheet 'Avancement Projets' format (legacy fallback)."""
    ws = wb["Avancement Projets"]

    week_val = ws["E2"].value
    week_str = ""
    if week_val:
        if hasattr(week_val, 'strftime'):
            week_str = week_val.strftime("%d/%m/%Y")
        else:
            week_str = str(week_val)

    projects = []
    for row in range(5, ws.max_row + 1):
        pid = safe_str(ws.cell(row, 1).value)
        nom = safe_str(ws.cell(row, 2).value)
        if not pid and not nom:
            continue

        projects.append({
            "id": pid,
            "projet": nom,
            "responsable": safe_str(ws.cell(row, 3).value),
            "type": safe_str(ws.cell(row, 4).value),
            "puissance": safe_num(ws.cell(row, 5).value),
            "phase": safe_str(ws.cell(row, 6).value),
            "avancement": safe_num(ws.cell(row, 7).value),
            "glissement": int(safe_num(ws.cell(row, 8).value)),
            "statut_eng": safe_str(ws.cell(row, 9).value),
            "statut_const": safe_str(ws.cell(row, 10).value),
            "statut_permis": safe_str(ws.cell(row, 11).value),
            "epc": safe_str(ws.cell(row, 12).value),
            "date_mes_prevue": safe_str(ws.cell(row, 13).value),
            "date_mes_revisee": safe_str(ws.cell(row, 14).value),
            "blocages": safe_str(ws.cell(row, 15).value),
            "actions_s1": safe_str(ws.cell(row, 16).value),
            "actions": safe_str(ws.cell(row, 17).value),
            "commentaires_dg": safe_str(ws.cell(row, 18).value),
            "reponse": safe_str(ws.cell(row, 19).value),
        })

    wb.close()
    return week_str, projects


def read_paiements():
    if not os.path.exists(PAIEMENTS_FILE):
        print(f"WARN: {PAIEMENTS_FILE} not found")
        return []

    wb = openpyxl.load_workbook(PAIEMENTS_FILE, data_only=True)

    # Try 52-sheet format first
    sheet_name = _find_latest_sheet(wb)
    if sheet_name and sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        start_row = 5  # Headers in row 4, data from row 5
    elif "Paiements" in wb.sheetnames:
        ws = wb["Paiements"]
        start_row = 5
    else:
        wb.close()
        print("WARN: No suitable paiements sheet found")
        return []

    payments = []
    for row in range(start_row, ws.max_row + 1):
        pid = safe_str(ws.cell(row, 1).value)
        projet = safe_str(ws.cell(row, 2).value)
        if not pid and not projet:
            continue
        if safe_str(ws.cell(row, 5).value).startswith("TOTAL"):
            continue

        payments.append({
            "id_projet": pid,
            "projet": projet,
            "contractant": safe_str(ws.cell(row, 3).value),
            "prestation": safe_str(ws.cell(row, 4).value),
            "description": safe_str(ws.cell(row, 5).value),
            "montant": safe_num(ws.cell(row, 6).value),
            "devise": safe_str(ws.cell(row, 7).value),
            "echeance": safe_str(ws.cell(row, 8).value),
            "statut": safe_str(ws.cell(row, 9).value),
            "actions": safe_str(ws.cell(row, 10).value),
        })

    wb.close()
    return payments


def main():
    week, projects = read_avancement()
    payments = read_paiements()

    data = {
        "week": week or "",
        "generated": __import__('datetime').datetime.now().isoformat(),
        "projects": projects,
        "payments": payments,
    }

    js = "/* Auto-generated by generate_reporting.py — DO NOT EDIT */\nwindow.REPORTING_ENR = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)

    print(f"OK: {OUT}")
    print(f"  Week: {week}")
    print(f"  Projects: {len(projects)}")
    print(f"  Payments: {len(payments)}")


if __name__ == "__main__":
    main()
