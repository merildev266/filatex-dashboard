"""
parsers/enr_sites.py — ENR site production parser.
Reads DIE/TMM/MJN rapport de production Excel files from SharePoint.
Exact port of generate_enr_data.py.
"""
import logging
from datetime import datetime

import sharepoint_client as sp

log = logging.getLogger(__name__)

_BASE = "01_Energy/Production/EnR"

SITES = {
    "DIE": {
        "name": "Diego",
        "entity": "Diego Green Power",
        "centrale": "Centrale Solaire d'Ankorikahely",
        "loc": "Ankorikahely, Diego",
        "capacityKwc": 2400,
        "file": "DIE_rapport_de_production.xlsx",
    },
    "TMM": {
        "name": "Tamatave",
        "entity": "Toamasina Green Power",
        "centrale": "Centrale Solaire de la Verrerie",
        "loc": "La Verrerie, Tamatave",
        "capacityKwc": 2000,
        "file": "TMM_rapport de production.xlsx",
    },
    "MJN": {
        "name": "Majunga",
        "entity": "Majunga Green Power",
        "centrale": "Centrale Solaire d'Andranotakatra",
        "loc": "Andranotakatra, Majunga",
        "capacityKwc": 1200,
        "file": "MJN_rapport de production.xlsx",
    },
}

MONTH_PATTERNS = {
    1: ["janv", "janvier"],
    2: ["fev", "f\u00e9v", "fevrier", "f\u00e9vrier"],
    3: ["mars"],
    4: ["avr", "avril"],
    5: ["mai"],
    6: ["juin"],
    7: ["juil", "juillet"],
    8: ["aout", "ao\u00fbt"],
    9: ["sept", "septembre"],
    10: ["oct", "octobre"],
    11: ["nov", "novembre"],
    12: ["dec", "d\u00e9c", "d\u00e9cembre", "decembre"],
}


def _match_month(sheet_name: str) -> int | None:
    sn = sheet_name.lower().strip()
    for month_num, patterns in MONTH_PATTERNS.items():
        for pat in patterns:
            if pat in sn:
                return month_num
    return None


def _sf(v, default=0.0) -> float:
    if v is None:
        return default
    try:
        f = float(v)
        return default if f != f else f  # NaN check
    except (TypeError, ValueError):
        return default


def _date_str(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if hasattr(v, "strftime"):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if s[:4].isdigit() and len(s) >= 10:
        return s[:10]
    return None


def _parse_index_sheet(ws) -> list:
    """Parse an 'Index compteur' sheet."""
    rows = []
    header_row = None
    date_col = None
    index_col = None
    prod_col = None
    peak_kw_col = None
    irradiance_col = None
    coupling_start_col = None
    coupling_end_col = None
    coupling_dur_col = None

    # Find header row (contains 'DATE')
    for r in range(1, min(10, ws.max_row + 1)):
        for c in range(1, min(ws.max_column + 1, 20)):
            v = ws.cell(r, c).value
            if v and str(v).strip().upper() == "DATE":
                header_row = r
                date_col = c
                break
        if header_row:
            break
    if not header_row:
        return rows

    # Find columns by header
    for c in range(1, min(ws.max_column + 1, 25)):
        v = ws.cell(header_row, c).value
        if not v:
            v_above = ws.cell(header_row - 1, c).value if header_row > 1 else None
            v_str = str(v_above).strip().upper() if v_above else ""
        else:
            v_str = str(v).strip().upper()
        if "INDEX" in v_str:
            index_col = c
        elif "PRODUCTION" in v_str and "KWH" in v_str:
            prod_col = c
        elif v_str == "KW":
            peak_kw_col = c
        elif "IRRADIANCE" in v_str or "KWH/M" in v_str or "WH/M" in v_str:
            irradiance_col = c

    # Check for coupling columns
    if header_row > 1:
        for c in range(1, min(ws.max_column + 1, 25)):
            v = ws.cell(header_row - 1, c).value
            if v:
                v_str = str(v).strip().lower()
                if "couplage" == v_str:
                    coupling_start_col = c
                elif "d\u00e9couplage" in v_str or "decouplage" in v_str:
                    coupling_end_col = c
                elif "dur\u00e9e" in v_str or "duree" in v_str:
                    coupling_dur_col = c

    for c in range(1, min(ws.max_column + 1, 25)):
        v = ws.cell(header_row, c).value
        if v:
            v_str = str(v).strip().lower()
            if "d\u00e9but" in v_str or "debut" in v_str:
                coupling_start_col = c
            elif "fin" == v_str:
                coupling_end_col = c

    first_index_row = header_row + 1
    prev_index = None
    # Check if first row is just a baseline index
    v_first_date = ws.cell(first_index_row, date_col).value if date_col else None
    v_first_prod = ws.cell(first_index_row, prod_col).value if prod_col else None
    if v_first_date and v_first_prod is None and index_col:
        try:
            prev_index = float(ws.cell(first_index_row, index_col).value)
        except (TypeError, ValueError):
            pass
        first_index_row += 1

    for r in range(first_index_row, ws.max_row + 1):
        date_val = ws.cell(r, date_col).value if date_col else None
        if not date_val:
            continue
        date_s = _date_str(date_val)
        if not date_s:
            continue

        prod_kwh = ws.cell(r, prod_col).value if prod_col else None
        if prod_kwh is None and index_col and prev_index is not None:
            cur_index = ws.cell(r, index_col).value
            if cur_index is not None:
                try:
                    prod_kwh = float(cur_index) - prev_index
                except (ValueError, TypeError):
                    pass
        if index_col:
            cur_idx = ws.cell(r, index_col).value
            if cur_idx is not None:
                try:
                    prev_index = float(cur_idx)
                except (ValueError, TypeError):
                    pass

        if prod_kwh is None or _sf(prod_kwh) <= 0:
            continue

        row_data = {"date": date_s, "prodKwh": round(_sf(prod_kwh), 1)}
        if peak_kw_col:
            v = ws.cell(r, peak_kw_col).value
            if v is not None:
                try:
                    row_data["peakKw"] = round(float(v))
                except (ValueError, TypeError):
                    pass
        if irradiance_col:
            v = ws.cell(r, irradiance_col).value
            if v is not None:
                try:
                    row_data["irradiance"] = round(float(v), 2)
                except (ValueError, TypeError):
                    pass
        if coupling_dur_col:
            v = ws.cell(r, coupling_dur_col).value
            if v is not None:
                try:
                    row_data["couplingHours"] = round(float(v), 2)
                except (ValueError, TypeError):
                    pass
        rows.append(row_data)
    return rows


def _parse_prod_solaire_sheet(ws) -> list:
    rows = []
    header_row = None
    for r in range(1, min(15, ws.max_row + 1)):
        v = ws.cell(r, 1).value
        if v and str(v).strip().upper() == "DATE":
            header_row = r
            break
    if not header_row:
        return rows

    for r in range(header_row + 1, ws.max_row + 1):
        date_val = ws.cell(r, 1).value
        if not date_val:
            continue
        date_s = _date_str(date_val)
        if not date_s:
            continue
        produced = ws.cell(r, 6).value
        if produced is None:
            continue
        row_data = {
            "date": date_s,
            "availHours": round(_sf(ws.cell(r, 2).value), 2),
            "schedInterrupt": round(_sf(ws.cell(r, 3).value), 2),
            "unschedInterrupt": round(_sf(ws.cell(r, 4).value), 2),
            "capacityKwc": round(_sf(ws.cell(r, 5).value)),
            "prodKwh": round(_sf(produced), 1),
            "consumedKwh": round(_sf(ws.cell(r, 7).value), 2),
            "deliveredKwh": round(_sf(ws.cell(r, 8).value), 1),
        }
        rows.append(row_data)
    return rows


def list_available_months() -> dict:
    """
    Return available months per ENR site by inspecting sheet names.

    Returns:
        {"enr": {"DIE": [1,2,3], "TMM": [1,2,3], "MJN": [1,2,3]}}
    """
    result = {}
    for code, cfg in SITES.items():
        rel_path = f"{_BASE}/{cfg['file']}"
        try:
            wb = sp.get_workbook(rel_path, read_only=True)
            months = sorted({m for sn in wb.sheetnames if (m := _match_month(sn)) is not None})
            wb.close()
            result[code] = months
        except Exception as exc:
            log.warning("ENR available months: error for %s: %s", code, exc)
            result[code] = []
    log.debug("ENR available months: %s", result)
    return {"enr": result}


def _build_site_data(code: str, site_cfg: dict, month: int | None = None) -> dict | None:
    rel_path = f"{_BASE}/{site_cfg['file']}"
    try:
        wb = sp.get_workbook(rel_path, read_only=False)
    except Exception as exc:
        log.error("ENR sites: failed to download %s: %s", rel_path, exc)
        return None

    daily_index = []
    daily_prod = []

    for sn in wb.sheetnames:
        sheet_month = _match_month(sn)
        if sheet_month is None:
            continue
        if month is not None and sheet_month != month:
            continue
        sn_lower = sn.lower()
        if "index" in sn_lower:
            daily_index.extend(_parse_index_sheet(wb[sn]))
        elif "prod" in sn_lower:
            daily_prod.extend(_parse_prod_solaire_sheet(wb[sn]))

    wb.close()

    # Merge data: prefer Prod solaire for availability, Index for irradiance/peak
    index_by_date = {r["date"]: r for r in daily_index}
    prod_by_date = {r["date"]: r for r in daily_prod}
    all_dates = sorted(set(list(index_by_date.keys()) + list(prod_by_date.keys())))

    daily = []
    for d in all_dates:
        idx = index_by_date.get(d, {})
        prd = prod_by_date.get(d, {})
        entry = {"date": d}
        entry["prodKwh"] = prd.get("prodKwh") or idx.get("prodKwh") or 0
        entry["deliveredKwh"] = prd.get("deliveredKwh") or entry["prodKwh"]
        entry["consumedKwh"] = prd.get("consumedKwh", 0)
        entry["peakKw"] = idx.get("peakKw", 0)
        entry["irradiance"] = idx.get("irradiance", 0)
        entry["availHours"] = prd.get("availHours", 0)
        entry["unschedInterrupt"] = prd.get("unschedInterrupt", 0)
        entry["schedInterrupt"] = prd.get("schedInterrupt", 0)
        entry["couplingHours"] = idx.get("couplingHours", 0)
        if entry["prodKwh"] > 0:
            daily.append(entry)

    # Aggregate by month
    monthly = {}
    for d in daily:
        ym = d["date"][:7]
        if ym not in monthly:
            monthly[ym] = {
                "month": ym,
                "totalProdKwh": 0, "totalDeliveredKwh": 0, "totalConsumedKwh": 0,
                "maxPeakKw": 0, "avgIrradiance": 0, "totalAvailHours": 0,
                "totalUnschedInterrupt": 0, "daysWithData": 0, "dailyProd": [],
            }
        m = monthly[ym]
        m["totalProdKwh"] += d["prodKwh"]
        m["totalDeliveredKwh"] += d["deliveredKwh"]
        m["totalConsumedKwh"] += d["consumedKwh"]
        m["maxPeakKw"] = max(m["maxPeakKw"], d["peakKw"])
        m["avgIrradiance"] += d["irradiance"]
        m["totalAvailHours"] += d["availHours"]
        m["totalUnschedInterrupt"] += d["unschedInterrupt"]
        m["daysWithData"] += 1
        m["dailyProd"].append(round(d["prodKwh"], 1))

    for ym, m in monthly.items():
        if m["daysWithData"] > 0:
            m["avgIrradiance"] = round(m["avgIrradiance"] / m["daysWithData"], 2)
            m["avgDailyProdKwh"] = round(m["totalProdKwh"] / m["daysWithData"], 1)
        else:
            m["avgDailyProdKwh"] = 0
        m["totalProdKwh"] = round(m["totalProdKwh"], 1)
        m["totalDeliveredKwh"] = round(m["totalDeliveredKwh"], 1)
        m["totalConsumedKwh"] = round(m["totalConsumedKwh"], 1)
        m["maxPeakKw"] = round(m["maxPeakKw"])
        m["totalAvailHours"] = round(m["totalAvailHours"], 1)
        m["totalUnschedInterrupt"] = round(m["totalUnschedInterrupt"], 1)

    latest = daily[-1] if daily else None
    total_prod_kwh = sum(d["prodKwh"] for d in daily)
    total_days = len(daily)
    avg_daily = round(total_prod_kwh / total_days, 1) if total_days > 0 else 0
    max_peak = max((d["peakKw"] for d in daily), default=0)

    return {
        "code": code,
        "name": site_cfg["name"],
        "entity": site_cfg["entity"],
        "centrale": site_cfg["centrale"],
        "loc": site_cfg["loc"],
        "capacityKwc": site_cfg["capacityKwc"],
        "capacityMw": round(site_cfg["capacityKwc"] / 1000, 2),
        "latestDate": latest["date"] if latest else None,
        "totalProdKwh": round(total_prod_kwh, 1),
        "avgDailyKwh": avg_daily,
        "maxPeakKw": round(max_peak),
        "monthly": sorted(monthly.values(), key=lambda m: m["month"]),
        "daily": daily[-90:],  # last 90 days
    }


def build(month: int | None = None) -> dict:
    """
    Return dict with ENR_SITES key.

    Args:
        month: If provided, include only data from that month's sheets.
               If None, include all months (current behaviour).
    """
    sites = []
    for code, cfg in SITES.items():
        site_data = _build_site_data(code, cfg, month=month)
        if site_data:
            sites.append(site_data)
        else:
            log.warning("ENR sites: no data for %s (month=%s)", code, month)
    log.info("ENR sites: %d sites loaded (month=%s)", len(sites), month)
    return {"ENR_SITES": sites}
