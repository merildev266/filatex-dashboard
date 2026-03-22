"""
parsers/enr_projects.py — ENR projects parser.
Merges data from 5+ Excel files. Exact port of generate_enr_projects.py.
"""
import logging
import re
import unicodedata
from datetime import datetime, date

import sharepoint_client as sp
from utils import find_latest_s_sheet, ss

log = logging.getLogger(__name__)

_BASE = "01_Energy/Projet/EnR"
_WEEKLY_FILE = f"{_BASE}/Weekly_Report/Weekly_EnR_Avancement.xlsx"

# ── Project ID mapping (verbatim from generate_enr_projects.py) ──
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
    # Paiements / Cost Control aliases
    "diego wind ph1": "diego-wind-1",
    "lidera majunga": "mahajanga",
    "vestop fihaonana": "fihaonana-1",
    "bongatsara ph1": "bongatsara-1",
    "oursun zfi ph1": "oursun-1",
    "moramanga ph1": "moramanga-1",
}


def _normalize(s: str) -> str:
    s = s.strip().lower().rstrip("#").rstrip().rstrip(",").strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    while "  " in s:
        s = s.replace("  ", " ")
    return s


_NORM_MAP = {_normalize(k): v for k, v in NAME_MAP.items()}


def resolve_id(name) -> str | None:
    if not name:
        return None
    n = _normalize(str(name))
    if n in _NORM_MAP:
        return _NORM_MAP[n]
    for key, pid in _NORM_MAP.items():
        if key in n or n in key:
            return pid
    return None


def _sf(v, default=None):
    if v is None:
        return default
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def _sd(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if len(s) >= 10 and s[4:5] == "-" and s[7:8] == "-":
        return s[:10]
    return None


def _read_dates_budgets(projects: dict, wb):
    ws = wb["Master Plan"]
    for row in range(4, ws.max_row + 1):
        name = ss(ws.cell(row, 2).value)
        if name.upper().startswith("TOTAL"):
            break
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        p["name"] = name.rstrip("#").strip()
        p["pvMw"] = _sf(ws.cell(row, 3).value)
        p["bessMwh"] = _sf(ws.cell(row, 4).value)
        p["capexM"] = _sf(ws.cell(row, 9).value)
        tri_val = _sf(ws.cell(row, 10).value)
        if tri_val is not None:
            p["tri"] = round(tri_val * 100, 1) if tri_val < 1 else round(tri_val, 1)
        p["engStart"] = _sd(ws.cell(row, 11).value)
        p["engEnd"] = _sd(ws.cell(row, 12).value)
        eng_pct = ws.cell(row, 13).value
        if eng_pct is not None:
            ep = _sf(eng_pct, 0)
            p["engPct"] = round(ep * 100) if ep <= 1 else round(ep)
        tend_val = ws.cell(row, 14).value
        if tend_val and str(tend_val).strip().lower() == "done":
            p["tendDone"] = True
            p["tendStart"] = None
        else:
            p["tendStart"] = _sd(tend_val)
            p["tendDone"] = False
        p["tendEnd"] = _sd(ws.cell(row, 15).value)
        p["constStart"] = _sd(ws.cell(row, 16).value)
        p["constEnd"] = _sd(ws.cell(row, 17).value)
        p["costDev"] = _sf(ws.cell(row, 18).value)
        p["costPv"] = _sf(ws.cell(row, 19).value)
        qtr_labels = ["Q3-25", "Q4-25", "Q1-26", "Q2-26", "Q3-26", "Q4-26", "Q1-27", "Q2-27", "Q3-27", "Q4-27"]
        qtr = []
        for i, ql in enumerate(qtr_labels):
            val = _sf(ws.cell(row, 20 + i).value)
            if val and val > 0:
                qtr.append({"q": ql, "a": round(val)})
        if qtr:
            p["qtr"] = qtr
        p["comment"] = ss(ws.cell(row, 30).value) or None


def _read_cost_control(projects: dict, wb):
    ws = wb["RECAP"]
    for row in range(5, ws.max_row + 1):
        name = ss(ws.cell(row, 1).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        bac = _sf(ws.cell(row, 3).value)
        forecast = _sf(ws.cell(row, 4).value)
        ac = _sf(ws.cell(row, 7).value)
        av_reel = ws.cell(row, 8).value
        spi = _sf(ws.cell(row, 13).value)
        cpi = _sf(ws.cell(row, 17).value)
        perf = ss(ws.cell(row, 16).value)
        av_val = None
        if av_reel is not None:
            f = _sf(av_reel)
            if f is not None:
                av_val = round(f * 100) if f <= 1 else round(f)
        cc = {}
        if bac is not None:
            cc["bac"] = round(bac)
        if forecast is not None:
            cc["forecast"] = round(forecast)
        if ac is not None:
            cc["ac"] = round(ac)
        if av_val is not None:
            cc["avReel"] = av_val
        if spi is not None and spi < 100:
            cc["spi"] = round(spi, 2)
        if cpi is not None and cpi < 100:
            cc["cpi"] = round(cpi, 2)
        if perf:
            cc["perf"] = perf
        if cc:
            p["cc"] = cc


def _read_dashboard_master(projects: dict, wb):
    ws_db = wb["DATABASE"]
    for row in range(3, ws_db.max_row + 1):
        name = ss(ws_db.cell(row, 2).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        loc = ss(ws_db.cell(row, 3).value)
        lead = ss(ws_db.cell(row, 6).value)
        epciste = ss(ws_db.cell(row, 7).value)
        puissance = _sf(ws_db.cell(row, 36).value)
        prod_jour = _sf(ws_db.cell(row, 37).value)
        glissement = _sf(ws_db.cell(row, 30).value)
        if loc: p["loc"] = loc
        if lead: p["lead"] = lead
        if epciste: p["epciste"] = epciste
        if puissance: p["puissance"] = round(puissance)
        if prod_jour: p["prodJour"] = round(prod_jour)
        if glissement is not None: p["glissement"] = int(glissement)

    ws_ps = wb["PROJECT STATUS"]
    for row in range(4, ws_ps.max_row + 1):
        name = ss(ws_ps.cell(row, 2).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        stage = ss(ws_ps.cell(row, 4).value)
        const_prog = _sf(ws_ps.cell(row, 11).value)
        if stage:
            if "construction" in stage.lower():
                p["phase"] = "Construction"
            elif "development" in stage.lower():
                p["phase"] = "Developpement"
        if const_prog is not None:
            p["constProg"] = round(const_prog, 2) if const_prog <= 1 else round(const_prog / 100, 2)


def _read_status_etudes(projects: dict, wb):
    ws = wb["DEVELOPMENT"]
    study_names = [
        "Etude Topographique", "Etude Geotechnique", "Test Arrachement",
        "Etude Faisabilite", "Etude de Ligne", "Categorisation Env.",
        "Etude Environnementale", "Permis Environnemental", "Permis Construire",
        "Autorisation ACM", "Etude Technico-Financiere",
    ]
    for row in range(3, ws.max_row + 1):
        name = ss(ws.cell(row, 1).value)
        pid = resolve_id(name)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        studies = []
        for i, sn in enumerate(study_names):
            val = _sf(ws.cell(row, 2 + i).value)
            pct = round(val) if val is not None else 0
            studies.append({"name": sn, "pct": pct})
        prog_m = _sf(ws.cell(row, 15).value)
        if prog_m is not None:
            p["engProgression"] = round(prog_m * 100) if prog_m <= 1 else round(prog_m)
        if any(s["pct"] > 0 for s in studies):
            p["studies"] = studies


def _find_latest_weekly_sheet(wb) -> str | None:
    for sn in reversed(wb.sheetnames):
        if not sn.startswith("S") or not sn[1:].isdigit():
            continue
        ws = wb[sn]
        for row in range(9, 30):
            if ws.cell(row, 6).value:
                return sn
    return None


def _read_weekly(projects: dict, wb) -> str:
    latest = _find_latest_weekly_sheet(wb)
    if not latest and "Avancement Projets" in wb.sheetnames:
        latest = "Avancement Projets"
    if not latest:
        return ""

    ws = wb[latest]
    # Try G3, E3, E2 for week date
    week_str = ""
    for cell_ref in ["G3", "E3", "E2"]:
        row = int(cell_ref[1:])
        col = ord(cell_ref[0]) - ord("A") + 1
        val = ws.cell(row, col).value
        if val:
            week_str = val.strftime("%d/%m/%Y") if hasattr(val, "strftime") else str(val)
            break

    is_old = latest == "Avancement Projets"
    data_start = 5 if is_old else 9
    col_map = (
        {"resp": 3, "type": 4, "phase": 6, "av": 7, "glis": 8, "statEtudes": 9,
         "statConst": 10, "epc": 12, "cod": 13, "blocages": 15, "actionsS1": 16, "actionsS": 17, "comDG": 18}
        if is_old else
        {"resp": 3, "type": 4, "phase": 6, "av": 7, "glis": 8, "statEtudes": 9,
         "statConst": 10, "epc": 11, "cod": 12, "blocages": 13, "actionsS1": 14, "actionsS": 15, "comDG": 16}
    )

    for row in range(data_start, ws.max_row + 1):
        pid = ss(ws.cell(row, 1).value)
        if not pid:
            continue
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]

        def _get(key): return ws.cell(row, col_map[key]).value

        resp = ss(_get("resp"))
        type_ = ss(_get("type"))
        phase = ss(_get("phase"))
        avancement = _sf(_get("av"))
        glissement = _sf(_get("glis"))
        stat_etudes = ss(_get("statEtudes"))
        stat_const = ss(_get("statConst"))
        epc = ss(_get("epc"))
        cod = _sd(_get("cod"))
        blocages = ss(_get("blocages"))
        actions_s1 = ss(_get("actionsS1"))
        actions_s = ss(_get("actionsS"))
        com_dg = ss(_get("comDG"))

        if resp: p["chef"] = resp
        if type_: p["type"] = type_
        if phase: p["phase"] = phase
        if avancement is not None:
            p["avancement"] = round(avancement)
            p["constProg"] = round(avancement / 100, 2)
        if glissement is not None: p["glissement"] = int(glissement)
        if stat_etudes: p["statutEtudes"] = stat_etudes
        if stat_const: p["statutConst"] = stat_const
        if epc: p["epciste"] = epc
        if cod: p["codPrevue"] = cod
        if blocages: p["blocages"] = blocages
        if actions_s1: p["actionsS1"] = actions_s1
        if actions_s: p["actionsS"] = actions_s
        if com_dg: p["commentairesDG"] = com_dg

    return week_str


def _read_paiements(projects: dict, wb_av, wb_pay=None):
    """Read payments from avancement (PAIEMENT sheet) or separate file."""
    ws = None
    is_new = False
    col_offset = 0
    data_start = 5

    if "PAIEMENT" in wb_av.sheetnames:
        ws = wb_av["PAIEMENT"]
        is_new = True
        col_offset = 1
        data_start = 3
    elif wb_pay:
        for sn in ["Paiements", "PAIEMENT", "Paiement"]:
            if sn in wb_pay.sheetnames:
                ws = wb_pay[sn]
                break

    if ws is None:
        return

    pmt_data = {}
    for row in range(data_start, ws.max_row + 1):
        projet_name = ss(ws.cell(row, 2 + col_offset).value)
        if not projet_name or "total" in projet_name.lower():
            continue
        pid = resolve_id(projet_name)
        if not pid:
            continue
        montant = _sf(ws.cell(row, 7 if is_new else 6).value, 0)
        devise = "USD" if is_new else ss(ws.cell(row, 7).value).upper()
        echeance = _sd(ws.cell(row, 8 + col_offset).value)
        statut = ss(ws.cell(row, 9 + col_offset).value).upper()
        contractant = ss(ws.cell(row, 3 + col_offset).value)
        prestation = ss(ws.cell(row, 4 + col_offset).value)
        description = ss(ws.cell(row, 5 + col_offset).value)
        actions = ss(ws.cell(row, 10 + col_offset).value)

        if pid not in pmt_data:
            pmt_data[pid] = {"lines": [], "totalUSD": 0, "totalMGA": 0, "ok": 0, "nok": 0}
        d = pmt_data[pid]
        line = {}
        if contractant: line["contractant"] = contractant
        if prestation: line["prestation"] = prestation
        if description: line["desc"] = description
        if montant: line["montant"] = montant
        if devise: line["devise"] = devise
        if echeance: line["echeance"] = echeance
        if statut: line["statut"] = statut
        if actions: line["actions"] = actions
        d["lines"].append(line)
        if "USD" in devise:
            d["totalUSD"] += montant
        else:
            d["totalMGA"] += montant
        if statut == "OK":
            d["ok"] += 1
        else:
            d["nok"] += 1

    for pid, d in pmt_data.items():
        if pid not in projects:
            projects[pid] = {"id": pid}
        p = projects[pid]
        pmt = {"count": len(d["lines"]), "ok": d["ok"], "nok": d["nok"]}
        if d["totalUSD"] > 0: pmt["totalUSD"] = round(d["totalUSD"], 2)
        if d["totalMGA"] > 0: pmt["totalMGA"] = round(d["totalMGA"])
        pmt["lines"] = d["lines"]
        p["paiements"] = pmt


def _determine_phase(p: dict) -> str:
    if "phase" in p:
        return p["phase"]
    cp = p.get("constProg")
    if cp is not None and cp >= 0.98:
        return "Termine"
    if cp is not None and cp > 0:
        return "Construction"
    if p.get("engPct", 0):
        return "Developpement"
    return "Planifie"


def build() -> dict:
    """Return dict with ENR_PROJECTS_DATA key."""
    projects = {}

    # File 1: Dates & Budgets
    try:
        wb = sp.get_workbook(f"{_BASE}/ENR_Dates_Projets_Budgets.xlsx", read_only=False)
        _read_dates_budgets(projects, wb)
        wb.close()
    except Exception as exc:
        log.warning("ENR projects: dates/budgets failed: %s", exc)

    # File 2: Cost Control
    try:
        wb = sp.get_workbook(f"{_BASE}/ENR_Cost_Control.xlsx", read_only=False)
        _read_cost_control(projects, wb)
        wb.close()
    except Exception as exc:
        log.warning("ENR projects: cost control failed: %s", exc)

    # File 3: Dashboard Master
    try:
        wb = sp.get_workbook(f"{_BASE}/ENR_Dashboard_Master.xlsx", read_only=False)
        _read_dashboard_master(projects, wb)
        wb.close()
    except Exception as exc:
        log.warning("ENR projects: dashboard master failed: %s", exc)

    # File 4: Status Etudes
    try:
        wb = sp.get_workbook(f"{_BASE}/ENR_Status_Etudes.xlsx", read_only=False)
        _read_status_etudes(projects, wb)
        wb.close()
    except Exception as exc:
        log.warning("ENR projects: status etudes failed: %s", exc)

    # File 5: Weekly Avancement
    week_str = ""
    wb_av = None
    try:
        wb_av = sp.get_workbook(_WEEKLY_FILE, read_only=False)
        week_str = _read_weekly(projects, wb_av)
    except Exception as exc:
        log.warning("ENR projects: weekly avancement failed: %s", exc)

    # Payments (from avancement or separate file)
    wb_pay = None
    try:
        wb_pay = sp.get_workbook(f"{_BASE}/Weekly_Report/Weekly_EnR_Paiements.xlsx", read_only=False)
    except Exception:
        pass

    _read_paiements(projects, wb_av or _FakeWb(), wb_pay)

    if wb_av: wb_av.close()
    if wb_pay: wb_pay.close()

    # Finalize
    for pid, p in projects.items():
        p["id"] = pid
        if "phase" not in p:
            p["phase"] = _determine_phase(p)
        if "name" not in p:
            p["name"] = pid

    phase_order = {"Termine": 0, "Construction": 1, "Developpement": 2, "Planifie": 3}
    project_list = sorted(
        projects.values(),
        key=lambda p: (phase_order.get(p.get("phase", ""), 9), p.get("name", "")),
    )

    data = {
        "generated": datetime.now().isoformat(),
        "week": week_str or "",
        "source": "SharePoint",
        "projects": project_list,
    }
    log.info("ENR projects: %d projects, week=%s", len(project_list), week_str)
    return {"ENR_PROJECTS_DATA": data}


class _FakeWb:
    """Stub used when avancement workbook failed to load."""
    sheetnames = []
