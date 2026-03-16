"""
Generate enr_projects_data.js from all EnR project Excel files.
Replaces the hardcoded enrProjects + enrEnrich in energy.js.

Sources (01_Energy/Projet/EnR/):
  - ENR_Dates_Projets_Budgets.xlsx  → base project data (dates, capex, MWc, TRI, quarters)
  - ENR_Cost_Control.xlsx           → cost control (BAC, AC, SPI, CPI, performance)
  - ENR_Dashboard_Master.xlsx       → DATABASE (lead, epc, glissement, puissance, prodJour)
                                      PROJECT STATUS (constProg)
  - ENR_Status_Etudes.xlsx          → DEVELOPMENT (study progress per category)
  - Weekly_EnR_Avancement.xlsx      → weekly overrides (avancement, blocages, actions)
"""
import json, os, sys, io
from datetime import datetime, date
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

BASE = os.path.join(
    os.environ.get("USERPROFILE", r"C:\Users\Meril"),
    "OneDrive - GROUPE FILATEX",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "01_Energy", "Projet", "EnR",
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "enr_projects_data.js")

# ══ PROJECT ID MAPPING ══
# Maps various Excel names to dashboard IDs
NAME_MAP = {
    "nosy-be phase 1": "nosy-be-1",
    "nosy-be phase1 3mwc": "nosy-be-1",
    "nosy be 3mw": "nosy-be-1",
    "tulear phase 2": "tulear-2",
    "tulear phase2 1mwc": "tulear-2",
    "tulear ground 1mw": "tulear-2",
    "moramanga phase 1": "moramanga-1",
    "mandrosolar phase1 15mwc": "moramanga-1",
    "msm ph1 15mw": "moramanga-1",
    "top energie diego wind phase 1": "diego-wind-1",
    "te diego wind phase1 0.12mwc": "diego-wind-1",
    "diego wind 120 kw": "diego-wind-1",
    "top energie ground solar bongatsara phase 1": "bongatsara-1",
    "te bongatsara phase1 5mwc": "bongatsara-1",
    "bongatsara ph1 5mw": "bongatsara-1",
    "bongatsara ph1: 5mw": "bongatsara-1",
    "oursun zfi phase 1": "oursun-1",
    "oursun rooftop phase1 3.2mwc": "oursun-1",
    "oursun 3,2 mw": "oursun-1",
    "vestop fihaonana phase 1": "fihaonana-1",
    "vestop fihaonana phase1 4mwc": "fihaonana-1",
    "vestop fihaonana 4mw": "fihaonana-1",
    "nosy-be phase 2": "nosy-be-2",
    "nosy-be phase2 2mwc": "nosy-be-2",
    "tulear phase 3": "tulear-3",
    "tulear phase3 3.1mwc": "tulear-3",
    "moramanga phase 2": "moramanga-2",
    "mandrosolar phase2 25mwc": "moramanga-2",
    "oursun zfi phase 2": "oursun-2",
    "oursun rooftop phase2 7.8mwc": "oursun-2",
    "top energie ground solar bongatsara phase 2": "bongatsara-2",
    "te bongatsara phase2 5mwc": "bongatsara-2",
    "top energie diego wind phase 2": "diego-wind-2",
    "te diego wind phase2 4.88mwc": "diego-wind-2",
    "vestop fihaonana phase 2": "fihaonana-2",
    "vestop fihaonana phase2 15mwc": "fihaonana-2",
    "top energie floating solar marais masay": "marais-masay",
    "te marais masay 10mwc floating": "marais-masay",
    "top energie ambohidratrimo": "ambohidratrimo",
    "te ambohidratrimo 10mwc": "ambohidratrimo",
    "small sites": "small-sites",
    "filatex energie small sites 2.175mwc": "small-sites",
    "lidera tamatave": "tamatave",
    "lidera phase2 toamasina 16mwc": "tamatave",
    "tamatave phase 2": "tamatave",
    "lidera diego": "diego-lidera",
    "lidera phase2 diego 7.6mwc": "diego-lidera",
    "diego phase 2": "diego-lidera",
    "lidera mahajanga": "mahajanga",
    "lidera phase2 majunga 10.75mwc": "mahajanga",
    "majunga phase 2": "mahajanga",
    "lidera phase3 toamasina 2mwc": "lidera-toamasina-3",
    "lidera toamasina phase 3": "lidera-toamasina-3",
    # Cost Control RECAP names
    "bongatsara ph1 5mw": "bongatsara-1",
    "tulear ground 1mw": "tulear-2",
    "msm ph1 15mw": "moramanga-1",
    "majunga phase 2": "mahajanga",
    "diego phase 2": "diego-lidera",
    "tamatave phase 2": "tamatave",
}


def _normalize(s):
    """Normalize string for matching: lowercase, strip accents, collapse spaces."""
    import unicodedata
    s = s.strip().lower()
    s = s.rstrip('#').rstrip().rstrip(',').strip()
    # Remove accents (é→e, etc.)
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    # Collapse multiple spaces
    while '  ' in s:
        s = s.replace('  ', ' ')
    return s


# Pre-build normalized NAME_MAP
_NORM_MAP = {_normalize(k): v for k, v in NAME_MAP.items()}


def resolve_id(name):
    if not name:
        return None
    n = _normalize(name)
    # Direct match
    if n in _NORM_MAP:
        return _NORM_MAP[n]
    # Partial match
    for key, pid in _NORM_MAP.items():
        if key in n or n in key:
            return pid
    return None


def safe_float(v, default=None):
    if v is None:
        return default
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def safe_date(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if len(s) >= 10 and s[4] == '-':
        return s[:10]
    return None


def safe_str(v):
    if v is None:
        return ""
    return str(v).strip()


# ══════════════════════════════════════════
# FILE 1: ENR_Dates_Projets_Budgets.xlsx
# ══════════════════════════════════════════
def read_dates_budgets(projects):
    path = os.path.join(BASE, "ENR_Dates_Projets_Budgets.xlsx")
    if not os.path.exists(path):
        print(f"  SKIP: {path}")
        return
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Master Plan"]

    for row in range(4, ws.max_row + 1):
        name = safe_str(ws.cell(row, 2).value)
        pid = resolve_id(name)
        if not pid:
            continue

        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        p["name"] = name.rstrip('#').strip()
        p["pvMw"] = safe_float(ws.cell(row, 3).value)
        p["bessMwh"] = safe_float(ws.cell(row, 4).value)
        p["capexM"] = safe_float(ws.cell(row, 9).value)
        tri_val = safe_float(ws.cell(row, 10).value)
        if tri_val is not None:
            p["tri"] = round(tri_val * 100, 1) if tri_val < 1 else round(tri_val, 1)
        p["engStart"] = safe_date(ws.cell(row, 11).value)
        p["engEnd"] = safe_date(ws.cell(row, 12).value)
        eng_pct = ws.cell(row, 13).value
        if eng_pct is not None:
            p["engPct"] = round(safe_float(eng_pct, 0) * 100) if safe_float(eng_pct, 0) <= 1 else round(safe_float(eng_pct, 0))
        tend_val = ws.cell(row, 14).value
        if tend_val and str(tend_val).strip().lower() == "done":
            p["tendDone"] = True
            p["tendStart"] = None
        else:
            p["tendStart"] = safe_date(tend_val)
            p["tendDone"] = False
        p["tendEnd"] = safe_date(ws.cell(row, 15).value)
        p["constStart"] = safe_date(ws.cell(row, 16).value)
        p["constEnd"] = safe_date(ws.cell(row, 17).value)
        p["costDev"] = safe_float(ws.cell(row, 18).value)
        p["costPv"] = safe_float(ws.cell(row, 19).value)

        # Quarterly funds (cols 20-29 = Q3-25 to Q4-27)
        qtr_labels = ["Q3-25","Q4-25","Q1-26","Q2-26","Q3-26","Q4-26","Q1-27","Q2-27","Q3-27","Q4-27"]
        qtr = []
        for i, ql in enumerate(qtr_labels):
            val = safe_float(ws.cell(row, 20 + i).value)
            if val and val > 0:
                qtr.append({"q": ql, "a": round(val)})
        if qtr:
            p["qtr"] = qtr

        p["comment"] = safe_str(ws.cell(row, 30).value) or None

    wb.close()
    print(f"  Dates/Budgets: {len([p for p in projects.values() if 'pvMw' in p])} projects")


# ══════════════════════════════════════════
# FILE 2: ENR_Cost_Control.xlsx
# ══════════════════════════════════════════
def read_cost_control(projects):
    path = os.path.join(BASE, "ENR_Cost_Control.xlsx")
    if not os.path.exists(path):
        print(f"  SKIP: {path}")
        return
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["RECAP"]

    count = 0
    for row in range(5, ws.max_row + 1):
        name = safe_str(ws.cell(row, 1).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        bac = safe_float(ws.cell(row, 3).value)
        forecast = safe_float(ws.cell(row, 4).value)
        ac = safe_float(ws.cell(row, 7).value)
        av_reel = ws.cell(row, 8).value
        spi = safe_float(ws.cell(row, 13).value)
        cpi = safe_float(ws.cell(row, 17).value)
        perf = safe_str(ws.cell(row, 16).value)

        # Parse avancement reel (can be decimal, integer, or text)
        av_val = None
        if av_reel is not None:
            f = safe_float(av_reel)
            if f is not None:
                av_val = round(f * 100) if f <= 1 else round(f)

        cc = {}
        if bac is not None: cc["bac"] = round(bac)
        if forecast is not None: cc["forecast"] = round(forecast)
        if ac is not None: cc["ac"] = round(ac)
        if av_val is not None: cc["avReel"] = av_val
        if spi is not None and spi < 100: cc["spi"] = round(spi, 2)
        if cpi is not None and cpi < 100: cc["cpi"] = round(cpi, 2)
        if perf: cc["perf"] = perf

        if cc:
            p["cc"] = cc
            count += 1

    wb.close()
    print(f"  Cost Control: {count} projects")


# ══════════════════════════════════════════
# FILE 3: ENR_Dashboard_Master.xlsx
# ══════════════════════════════════════════
def read_dashboard_master(projects):
    path = os.path.join(BASE, "ENR_Dashboard_Master.xlsx")
    if not os.path.exists(path):
        print(f"  SKIP: {path}")
        return
    wb = openpyxl.load_workbook(path, data_only=True)

    # DATABASE sheet
    ws_db = wb["DATABASE"]
    count_db = 0
    for row in range(3, ws_db.max_row + 1):
        name = safe_str(ws_db.cell(row, 2).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        loc = safe_str(ws_db.cell(row, 3).value)
        lead = safe_str(ws_db.cell(row, 6).value)
        epciste = safe_str(ws_db.cell(row, 7).value)
        puissance = safe_float(ws_db.cell(row, 36).value)
        prod_jour = safe_float(ws_db.cell(row, 37).value)
        glissement = safe_float(ws_db.cell(row, 30).value)

        if loc: p["loc"] = loc
        if lead: p["lead"] = lead
        if epciste: p["epciste"] = epciste
        if puissance: p["puissance"] = round(puissance)
        if prod_jour: p["prodJour"] = round(prod_jour)
        if glissement is not None: p["glissement"] = int(glissement)
        count_db += 1

    # PROJECT STATUS sheet
    ws_ps = wb["PROJECT STATUS"]
    count_ps = 0
    for row in range(4, ws_ps.max_row + 1):
        name = safe_str(ws_ps.cell(row, 2).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        stage = safe_str(ws_ps.cell(row, 4).value)
        const_prog = safe_float(ws_ps.cell(row, 11).value)

        if stage:
            if "construction" in stage.lower():
                p["phase"] = "Construction"
            elif "development" in stage.lower():
                p["phase"] = "Developpement"

        if const_prog is not None:
            p["constProg"] = round(const_prog, 2) if const_prog <= 1 else round(const_prog / 100, 2)
            count_ps += 1

    wb.close()
    print(f"  Dashboard Master: {count_db} (DB) + {count_ps} (STATUS)")


# ══════════════════════════════════════════
# FILE 4: ENR_Status_Etudes.xlsx
# ══════════════════════════════════════════
def read_status_etudes(projects):
    path = os.path.join(BASE, "ENR_Status_Etudes.xlsx")
    if not os.path.exists(path):
        print(f"  SKIP: {path}")
        return
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["DEVELOPMENT"]

    study_names = [
        "Etude Topographique", "Etude Geotechnique", "Test Arrachement",
        "Etude Faisabilite", "Etude de Ligne", "Categorisation Env.",
        "Etude Environnementale", "Permis Environnemental", "Permis Construire",
        "Autorisation ACM", "Etude Technico-Financiere"
    ]

    count = 0
    for row in range(3, ws.max_row + 1):
        name = safe_str(ws.cell(row, 1).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        # Read study progress (columns 2-12)
        studies = []
        for i, sn in enumerate(study_names):
            val = safe_float(ws.cell(row, 2 + i).value)
            pct = round(val) if val is not None else 0
            studies.append({"name": sn, "pct": pct})

        # Progression M (col 15)
        prog_m = safe_float(ws.cell(row, 15).value)
        if prog_m is not None:
            p["engProgression"] = round(prog_m * 100) if prog_m <= 1 else round(prog_m)

        if any(s["pct"] > 0 for s in studies):
            p["studies"] = studies
            count += 1

    wb.close()
    print(f"  Status Etudes: {count} projects")


# ══════════════════════════════════════════
# FILE 5: Weekly_EnR_Avancement.xlsx
# ══════════════════════════════════════════
def read_weekly(projects):
    path = os.path.join(BASE, "Weekly_EnR_Avancement.xlsx")
    if not os.path.exists(path):
        print(f"  SKIP: {path}")
        return None
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Avancement Projets"]

    week_val = ws["E2"].value
    week_str = ""
    if week_val:
        week_str = week_val.strftime("%d/%m/%Y") if hasattr(week_val, 'strftime') else str(week_val)

    count = 0
    for row in range(5, ws.max_row + 1):
        pid = safe_str(ws.cell(row, 1).value)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        # Weekly fields override
        resp = safe_str(ws.cell(row, 3).value)
        type_ = safe_str(ws.cell(row, 4).value)
        phase = safe_str(ws.cell(row, 6).value)
        avancement = safe_float(ws.cell(row, 7).value)
        glissement = safe_float(ws.cell(row, 8).value)
        epc = safe_str(ws.cell(row, 12).value)
        blocages = safe_str(ws.cell(row, 15).value)
        actions_s1 = safe_str(ws.cell(row, 16).value)
        actions_s = safe_str(ws.cell(row, 17).value)
        commentaires_dg = safe_str(ws.cell(row, 18).value)

        if resp: p["chef"] = resp
        if type_: p["type"] = type_
        if phase: p["phase"] = phase
        if avancement is not None:
            p["avancement"] = round(avancement)
            p["constProg"] = round(avancement / 100, 2)
        if glissement is not None: p["glissement"] = int(glissement)
        if epc: p["epciste"] = epc
        if blocages: p["blocages"] = blocages
        if actions_s1: p["actionsS1"] = actions_s1
        if actions_s: p["actionsS"] = actions_s
        if commentaires_dg: p["commentairesDG"] = commentaires_dg
        count += 1

    wb.close()
    print(f"  Weekly: {count} projects (week: {week_str})")
    return week_str


# ══════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════
def determine_phase(p):
    """Determine project phase from available data."""
    if "phase" in p:
        return p["phase"]
    cp = p.get("constProg")
    if cp is not None and cp >= 0.98:
        return "Termine"
    if cp is not None and cp > 0:
        return "Construction"
    eng = p.get("engPct", 0)
    if eng and eng > 0:
        return "Developpement"
    return "Planifie"


def main():
    print("Generating EnR projects data...")
    print(f"Source: {BASE}\n")

    projects = {}

    # Read in order of priority (later sources override earlier)
    read_dates_budgets(projects)
    read_cost_control(projects)
    read_dashboard_master(projects)
    read_status_etudes(projects)
    week_str = read_weekly(projects)

    # Finalize
    for pid, p in projects.items():
        p["id"] = pid
        if "phase" not in p:
            p["phase"] = determine_phase(p)
        if "name" not in p:
            p["name"] = pid

    # Sort by phase then name
    phase_order = {"Termine": 0, "Construction": 1, "Developpement": 2, "Planifie": 3}
    project_list = sorted(projects.values(), key=lambda p: (phase_order.get(p.get("phase", ""), 9), p.get("name", "")))

    data = {
        "generated": datetime.now().isoformat(),
        "week": week_str or "",
        "source": "01_Energy/Projet/EnR/",
        "projects": project_list,
    }

    js = "/* Auto-generated by generate_enr_projects.py — DO NOT EDIT */\n"
    js += f"// Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    js += "window.ENR_PROJECTS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2, default=str) + ";\n"

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)

    print(f"\nOK: {OUT}")
    print(f"  Projects: {len(project_list)}")
    print(f"  Week: {week_str}")
    phases = {}
    for p in project_list:
        ph = p.get("phase", "?")
        phases[ph] = phases.get(ph, 0) + 1
    print(f"  Phases: {phases}")


if __name__ == "__main__":
    main()
