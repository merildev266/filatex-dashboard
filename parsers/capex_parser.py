"""
parsers/capex_parser.py — CAPEX parser.
Reads CAPEX.xlsx from SharePoint (7 sheets) and returns capexData dict.
Exact port of generate_capex.py using openpyxl via SharePoint.
"""
import logging
from datetime import datetime, date

import sharepoint_client as sp

log = logging.getLogger(__name__)

_FILE = "04_CAPEX/CAPEX.xlsx"


def _sv(v) -> float:
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        try:
            f = float(v)
            return 0.0 if f != f else round(f, 2)  # isnan check
        except (ValueError, TypeError):
            return 0.0
    if isinstance(v, str) and v.strip() in ("", "-", "#REF!", "#N/A"):
        return 0.0
    try:
        return round(float(v), 2)
    except (ValueError, TypeError):
        return 0.0


def _fmt_amt(n: float) -> str:
    if n == 0:
        return "\u2014"
    if abs(n) >= 1_000_000:
        v = n / 1_000_000
        return f"{int(v)} M$" if v == int(v) else f"{v:.1f} M$"
    if abs(n) >= 1000:
        return f"{int(round(n / 1000))} k$"
    return f"{int(n)} $"


def _fmt_amt_full(n: float) -> str:
    if n == 0:
        return "\u2014"
    s = f"{int(round(n)):,}".replace(",", " ")
    return f"{s} $"


def _fmt_date(v) -> str:
    if v is None:
        return "\u2014"
    if hasattr(v, "strftime"):
        return v.strftime("%d.%m.%y")
    if isinstance(v, str):
        if "/" in v:
            return v
        if v in ("N/A", "-", ""):
            return "\u2014"
    return str(v)[:10] if v else "\u2014"


def _fmt_pct(n: float) -> str:
    if n == 0:
        return "\u2014"
    if n < 1:
        return f"{n * 100:.0f}%"
    return f"{n:.0f}%"


def _make_proj(idx, name, status, invest_init, invest_reel, delta_invest,
               etat_en_cours, etat_total, etat_pct, cf_in, cf_out, cf_net,
               tri_init, tri_reel, delta_perf,
               date_deb_init, date_deb_reel, date_fin_init, date_fin_reel, prefix="") -> dict:
    return {
        "id": f"{prefix}{idx}",
        "name": name,
        "status": status,
        "investInit": invest_init,
        "investReel": invest_reel,
        "deltaInvest": delta_invest,
        "etatEnCours": etat_en_cours,
        "etatTotal": etat_total,
        "etatPct": etat_pct,
        "cfIn": cf_in,
        "cfOut": cf_out,
        "cfNet": cf_net,
        "triInit": tri_init,
        "triReel": tri_reel,
        "deltaPerf": delta_perf,
        "dateDebInit": date_deb_init,
        "dateDebReel": date_deb_reel,
        "dateFinInit": date_fin_init,
        "dateFinReel": date_fin_reel,
    }


def _read_enat(ws) -> list:
    """Read ENAT sheet rows 9-36."""
    raw = []
    for r in range(9, 37):
        name = ws.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        raw.append({
            "name": str(name).strip(),
            "init": _sv(ws.cell(r, 3).value),
            "incurred": _sv(ws.cell(r, 5).value),
            "h1_26": _sv(ws.cell(r, 6).value),
            "h2_26": _sv(ws.cell(r, 7).value),
            "y2027": _sv(ws.cell(r, 8).value),
            "tri": _sv(ws.cell(r, 10).value),
            "start": ws.cell(r, 12).value,
            "end_init": ws.cell(r, 13).value,
            "end_rev": ws.cell(r, 14).value,
        })

    # Group studies with parent projects
    groups = {}
    order = []
    for p in raw:
        n = p["name"]
        is_study = "(Studies)" in n or "(Study)" in n
        base = n.replace(" (Studies)", "").replace("(Studies)", "").replace(" (Study)", "").replace("(Study)", "").strip()
        if base not in groups:
            groups[base] = {"main": None, "study": None}
            order.append(base)
        if is_study:
            groups[base]["study"] = p
        else:
            groups[base]["main"] = p

    projects = []
    idx = 1
    for base in order:
        g = groups[base]
        main = g["main"] or g["study"]
        study = g["study"]
        if not main:
            continue
        total_init = main["init"] + (study["init"] if study else 0)
        total_incurred = main["incurred"] + (study["incurred"] if study else 0)
        if total_init == 0 and total_incurred == 0:
            continue

        budget = total_init
        pct = min(round(total_incurred / budget * 100) if budget > 0 else 0, 100)
        h1 = main["h1_26"] + (study["h1_26"] if study else 0)
        h2 = main["h2_26"] + (study["h2_26"] if study else 0)
        total_cf = h1 + h2 + main["y2027"]
        if total_cf > 0:
            m1 = round(h1 / 6 / total_cf * 60) if h1 else 0
            m2 = round(h2 / 6 / total_cf * 60) if h2 else 0
            cf_out = [max(1, m1)] * 3 + [max(1, m2)] * 3 if (m1 + m2) > 0 else [0] * 6
        else:
            cf_out = [0] * 6

        end_rev = main.get("end_rev")
        status = "delayed" if (end_rev and isinstance(end_rev, str) and len(str(end_rev)) > 15) else "on-track"

        projects.append(_make_proj(
            idx=f"enr-{idx}", name=base, status=status,
            invest_init=_fmt_amt_full(total_init),
            invest_reel=_fmt_amt_full(total_incurred) if total_incurred > 0 else "\u2014",
            delta_invest="\u2014",
            etat_en_cours=_fmt_amt(total_incurred),
            etat_total=_fmt_amt(budget),
            etat_pct=pct,
            cf_in=[0] * 6, cf_out=cf_out, cf_net="\u2014",
            tri_init=_fmt_pct(main["tri"]) if main["tri"] else "\u2014",
            tri_reel="\u2014", delta_perf="up",
            date_deb_init=_fmt_date(main["start"]),
            date_deb_reel=_fmt_date(main["start"]),
            date_fin_init=_fmt_date(main["end_init"]),
            date_fin_reel=_fmt_date(end_rev) if (end_rev and hasattr(end_rev, "strftime")) else "\u2014",
            prefix="",
        ))
        idx += 1
    return projects, idx


def _read_lidera(ws, start_idx: int) -> tuple:
    projects = []
    idx = start_idx
    for r in range(9, 18):
        name = ws.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        init = _sv(ws.cell(r, 3).value)
        revised = _sv(ws.cell(r, 4).value)
        incurred = _sv(ws.cell(r, 5).value)
        tri = _sv(ws.cell(r, 10).value)
        start = ws.cell(r, 12).value
        end_init = ws.cell(r, 13).value
        end_rev = ws.cell(r, 14).value
        budget = revised if revised > 0 else init
        if budget == 0 and incurred == 0:
            continue
        pct = min(round(incurred / budget * 100) if budget > 0 else 0, 100)
        delta = f"{round((revised - init) / init * 100):+d}%" if init > 0 and revised > 0 else "\u2014"
        projects.append(_make_proj(
            idx=f"enr-{idx}",
            name="LIDERA \u2013 " + str(name).strip(),
            status="on-track",
            invest_init=_fmt_amt_full(init) if init > 0 else "\u2014",
            invest_reel=_fmt_amt_full(revised) if revised > 0 else "\u2014",
            delta_invest=delta,
            etat_en_cours=_fmt_amt(incurred),
            etat_total=_fmt_amt(budget),
            etat_pct=pct,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init=_fmt_pct(tri) if tri else "\u2014",
            tri_reel="\u2014", delta_perf="up",
            date_deb_init=_fmt_date(start),
            date_deb_reel=_fmt_date(start),
            date_fin_init=_fmt_date(end_init),
            date_fin_reel=_fmt_date(end_rev) if end_rev else "\u2014",
            prefix="",
        ))
        idx += 1
    return projects, idx


def _read_lidera_serv(ws, start_idx: int) -> tuple:
    projects = []
    idx = start_idx
    for r in range(9, 12):
        name = ws.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        init = _sv(ws.cell(r, 3).value)
        revised = _sv(ws.cell(r, 4).value)
        incurred = _sv(ws.cell(r, 5).value)
        tri_init = _sv(ws.cell(r, 10).value)
        tri_rev = _sv(ws.cell(r, 11).value)
        budget = revised if revised > 0 else init
        if budget == 0:
            continue
        pct = min(round(incurred / budget * 100) if budget > 0 else 0, 100)
        projects.append(_make_proj(
            idx=f"enr-{idx}",
            name="LIDERA SERV \u2013 " + str(name).strip()[:50],
            status="on-track",
            invest_init=_fmt_amt_full(init),
            invest_reel=_fmt_amt_full(revised) if revised != init else "\u2014",
            delta_invest="\u2014",
            etat_en_cours=_fmt_amt(incurred),
            etat_total=_fmt_amt(budget),
            etat_pct=pct,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init=_fmt_pct(tri_init) if tri_init else "\u2014",
            tri_reel=_fmt_pct(tri_rev) if tri_rev else "\u2014",
            delta_perf="up" if tri_rev >= tri_init else ("down" if tri_rev > 0 else "up"),
            date_deb_init="\u2014", date_deb_reel="\u2014", date_fin_init="\u2014", date_fin_reel="\u2014",
            prefix="",
        ))
        idx += 1
    return projects, idx


def _read_hfo(ws) -> list:
    projects = []
    idx = 1
    current_section = None
    section_data = {}
    section_order = []

    for r in range(9, 57):
        name = ws.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        name_str = str(name).strip()

        if "USD" in name_str or "IRR" in name_str:
            clean = name_str.split(":")[0].strip() if ":" in name_str else name_str
            for suffix in [" -", " \u2013"]:
                if clean.endswith(suffix):
                    clean = clean[: -len(suffix)]
            current_section = clean
            total_named, irr_named = 0, 0
            if "USD" in name_str:
                try:
                    p = name_str.split("USD")[1].split("/")[0].strip().replace(",", "").replace(" ", "").replace("\xa0", "")
                    total_named = float(p)
                except (ValueError, IndexError):
                    pass
            if "IRR" in name_str:
                try:
                    p = name_str.split("IRR")[1].strip().rstrip("%").strip()
                    irr_named = float(p)
                except (ValueError, IndexError):
                    pass
            section_data[current_section] = {
                "total_named": total_named, "irr": irr_named,
                "total_init": 0, "total_revised": 0, "total_incurred": 0,
                "start": None, "end": None,
            }
            section_order.append(current_section)
        elif current_section and current_section in section_data:
            sd = section_data[current_section]
            sd["total_init"] += _sv(ws.cell(r, 4).value)
            sd["total_revised"] += _sv(ws.cell(r, 5).value)
            sd["total_incurred"] += _sv(ws.cell(r, 6).value)
            if ws.cell(r, 13).value and not sd["start"]:
                sd["start"] = ws.cell(r, 13).value
            if ws.cell(r, 14).value and not sd["end"]:
                sd["end"] = ws.cell(r, 14).value

    for sec_name in section_order:
        sd = section_data[sec_name]
        init_val = sd["total_named"] if sd["total_named"] > 0 else sd["total_init"]
        revised_val = sd["total_revised"]
        budget = revised_val if revised_val > 0 else init_val
        if budget == 0:
            continue
        incurred = sd["total_incurred"]
        pct = min(round(incurred / budget * 100) if budget > 0 else 0, 100)
        over = incurred > budget * 1.1
        projects.append(_make_proj(
            idx=f"hfo-{idx}", name=sec_name,
            status="over-budget" if over else "on-track",
            invest_init=_fmt_amt_full(init_val) if init_val > 0 else "\u2014",
            invest_reel=_fmt_amt_full(revised_val) if revised_val > 0 and revised_val != init_val else "\u2014",
            delta_invest="\u2014",
            etat_en_cours=_fmt_amt(incurred),
            etat_total=_fmt_amt(budget),
            etat_pct=pct,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init=f"{int(sd['irr'])}%" if sd["irr"] else "\u2014",
            tri_reel="\u2014", delta_perf="up",
            date_deb_init=_fmt_date(sd["start"]),
            date_deb_reel=_fmt_date(sd["start"]),
            date_fin_init=_fmt_date(sd["end"]),
            date_fin_reel="\u2014",
            prefix="",
        ))
        idx += 1
    return projects


def _read_immo(ws_trav, ws_foncier) -> list:
    projects = []
    idx = 1
    for r in range(9, 33):
        name = ws_trav.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        init = _sv(ws_trav.cell(r, 3).value)
        revised = _sv(ws_trav.cell(r, 4).value)
        incurred = _sv(ws_trav.cell(r, 5).value)
        tri = _sv(ws_trav.cell(r, 10).value)
        start = ws_trav.cell(r, 12).value
        end_rev = ws_trav.cell(r, 14).value
        budget = revised if revised > 0 else init
        if budget == 0 and incurred == 0:
            continue
        pct = min(round(incurred / budget * 100) if budget > 0 else 0, 100)
        delta = f"{round((revised - init) / init * 100):+d}%" if init > 0 and revised > 0 and abs(revised - init) > 100 else "\u2014"
        projects.append(_make_proj(
            idx=f"immo-{idx}", name=str(name).strip(),
            status="on-track",
            invest_init=_fmt_amt_full(init) if init > 0 else "\u2014",
            invest_reel=_fmt_amt_full(revised) if revised > 0 and abs(revised - init) > 100 else "\u2014",
            delta_invest=delta,
            etat_en_cours=_fmt_amt(incurred),
            etat_total=_fmt_amt(budget),
            etat_pct=pct,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init=_fmt_pct(tri) if tri else "\u2014",
            tri_reel="\u2014", delta_perf="up",
            date_deb_init=_fmt_date(start),
            date_deb_reel=_fmt_date(start),
            date_fin_init="\u2014",
            date_fin_reel=_fmt_date(end_rev) if end_rev else "\u2014",
            prefix="",
        ))
        idx += 1

    for r in range(9, 22):
        name = ws_foncier.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        total = _sv(ws_foncier.cell(r, 6).value)
        if total == 0:
            continue
        projects.append(_make_proj(
            idx=f"immo-{idx}",
            name="Foncier \u2013 " + str(name).strip(),
            status="on-track",
            invest_init=_fmt_amt_full(total), invest_reel="\u2014", delta_invest="\u2014",
            etat_en_cours="\u2014", etat_total=_fmt_amt(total), etat_pct=0,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init="\u2014", tri_reel="\u2014", delta_perf="up",
            date_deb_init="\u2014", date_deb_reel="\u2014", date_fin_init="\u2014", date_fin_reel="\u2014",
            prefix="",
        ))
        idx += 1
    return projects


def _read_ventures(ws) -> list:
    projects = []
    idx = 1
    # Disbursements from rows 25-33
    disbursements = {}
    for r in range(25, 34):
        n = ws.cell(r, 2).value
        if not n or str(n).strip() in ("", "TOTAL"):
            continue
        disbursements[str(n).strip().lower()] = _sv(ws.cell(r, 5).value)

    for r in range(9, 18):
        name = ws.cell(r, 2).value
        if not name or str(name).strip() in ("", "TOTAL"):
            continue
        init = _sv(ws.cell(r, 3).value)
        revised = _sv(ws.cell(r, 4).value)
        incurred = _sv(ws.cell(r, 5).value)
        tri_init = _sv(ws.cell(r, 10).value)
        tri_rev = _sv(ws.cell(r, 11).value)
        budget = revised if revised > 0 else init
        if budget == 0:
            continue
        key = str(name).strip().rstrip(" :").lower()
        disbursed = 0
        for dk, dv in disbursements.items():
            if key[:8] in dk or dk[:8] in key:
                disbursed = dv
                break
        actual_amt = disbursed if disbursed > 0 else incurred
        actual_pct = min(round(actual_amt / budget * 100) if budget > 0 else 0, 100)
        delta = f"{round((revised - init) / init * 100):+d}%" if init > 0 and revised > 0 and abs(revised - init) > 100 else "\u2014"
        name_clean = str(name).strip().rstrip(" :")
        projects.append(_make_proj(
            idx=f"ven-{idx}", name=name_clean,
            status="delayed" if "restructure" in str(name).lower() else "on-track",
            invest_init=_fmt_amt_full(init),
            invest_reel=_fmt_amt_full(revised) if revised > 0 and abs(revised - init) > 100 else "\u2014",
            delta_invest=delta,
            etat_en_cours=_fmt_amt(actual_amt),
            etat_total=_fmt_amt(budget),
            etat_pct=actual_pct,
            cf_in=[0] * 6, cf_out=[0] * 6, cf_net="\u2014",
            tri_init=_fmt_pct(tri_init) if tri_init else "\u2014",
            tri_reel=_fmt_pct(tri_rev) if tri_rev else "\u2014",
            delta_perf="up" if (tri_rev and tri_rev >= tri_init) else ("down" if tri_rev > 0 else "up"),
            date_deb_init="\u2014", date_deb_reel="\u2014", date_fin_init="\u2014", date_fin_reel="\u2014",
            prefix="",
        ))
        idx += 1
    return projects


def build() -> dict:
    """Return dict with capexData key."""
    try:
        wb = sp.get_workbook(_FILE, read_only=False)
    except Exception as exc:
        log.error("CAPEX: failed to download %s: %s", _FILE, exc)
        raise

    # Sheet names may have trailing spaces as in the original
    def _sheet(name):
        for sn in wb.sheetnames:
            if sn.strip() == name.strip():
                return wb[sn]
        raise KeyError(f"Sheet not found: {name!r} in {wb.sheetnames}")

    ws_enat = _sheet("ENAT ")
    ws_lidera = _sheet("LIDERA ")
    ws_lidera_serv = _sheet("LIDERA SERV ")
    ws_hfo = _sheet("HFO ")
    ws_immo_trav = _sheet("IMMO TRAV")
    ws_immo_foncier = _sheet("IMMO Foncier")
    ws_ventures = _sheet("VENTURES EXT")

    enr_projects, next_idx = _read_enat(ws_enat)
    lidera_projects, next_idx2 = _read_lidera(ws_lidera, next_idx)
    lidera_serv_projects, _ = _read_lidera_serv(ws_lidera_serv, next_idx2)
    all_enr = enr_projects + lidera_projects + lidera_serv_projects

    hfo_projects = _read_hfo(ws_hfo)
    immo_projects = _read_immo(ws_immo_trav, ws_immo_foncier)
    ven_projects = _read_ventures(ws_ventures)

    wb.close()

    data = {
        "enr": {
            "color": "#00ab63",
            "colorRgb": "116,184,89",
            "title": "EnR \u2014 \u00c9nergies Renouvelables (ENAT + LIDERA)",
            "projects": all_enr,
        },
        "hfo": {
            "color": "#426ab3",
            "colorRgb": "100,136,255",
            "title": "HFO \u2014 Centrales Thermiques",
            "projects": hfo_projects,
        },
        "immo": {
            "color": "#FDB823",
            "colorRgb": "248,193,0",
            "title": "Immobilier \u2014 Patrimoine (Travaux + Foncier)",
            "projects": immo_projects,
        },
        "ventures": {
            "color": "#f37056",
            "colorRgb": "255,135,88",
            "title": "Ventures \u2014 Investissements Externes",
            "projects": ven_projects,
        },
    }
    log.info("CAPEX: enr=%d, hfo=%d, immo=%d, ven=%d",
             len(all_enr), len(hfo_projects), len(immo_projects), len(ven_projects))
    return {"capexData": data}
