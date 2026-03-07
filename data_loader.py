"""
Loads Tamatave and Diego xlsx daily reports and transforms them into the
siteData format expected by the Filatex PMO Dashboard frontend.
"""
import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "1. DATA Meril HIVANAKO",
    "Bureau",
    "Production site HFO",
)

# ══════════════════════════════════════════════════════════════
# SITE CONFIGURATIONS
# ══════════════════════════════════════════════════════════════

SITE_CONFIG = {
    "tamatave": {
        "name": "Tamatave",
        "data_dir": os.path.join(BASE_DIR, "Tamatave"),
        "file_pattern": "Tamatave_2026_*.xlsx",
        "contrat": 24,
        "mw_per_dg": 1.85,
        "warn_threshold": 8,  # below this many running DGs = warn
        "prod_obj_24h": 19.2,
        "prod_obj_month": 430,
        "prod_obj_year": 5160,
        "prev2025": {
            "24h": {"prod": 16.8, "dispo": 95.1, "sfoc": 202, "sloc": 0.84},
            "month": {"prod": 398, "dispo": 94.5, "sfoc": 203, "sloc": 0.85},
            "year": {"prod": 4620, "dispo": 94.1, "sfoc": 205, "sloc": 0.86},
        },
        "num_engines": 13,
        "engine_map": [
            {"id": "DG1",  "col_conso": 8,  "col_rh": 9,  "model": "9L20",     "mw": 1.85},
            {"id": "DG2",  "col_conso": 10, "col_rh": 11, "model": "9L20",     "mw": 1.85},
            {"id": "DG3",  "col_conso": 12, "col_rh": 13, "model": "9L20",     "mw": 1.85},
            {"id": "DG4",  "col_conso": 14, "col_rh": 15, "model": "9L20",     "mw": 1.85},
            {"id": "DG5",  "col_conso": 16, "col_rh": 17, "model": "9L20",     "mw": 1.85},
            {"id": "DG6",  "col_conso": 18, "col_rh": 19, "model": "9L20",     "mw": 1.85},
            {"id": "DG7",  "col_conso": 20, "col_rh": 21, "model": "18V32LN",  "mw": 1.85},
            {"id": "DG8",  "col_conso": 22, "col_rh": 23, "model": "18V32STD", "mw": 1.85},
            {"id": "DG9",  "col_conso": 24, "col_rh": 25, "model": "12V32LN",  "mw": 1.85},
            {"id": "DG10", "col_conso": 26, "col_rh": 27, "model": "12V32LN",  "mw": 1.85},
            {"id": "DG11", "col_conso": 28, "col_rh": 29, "model": "12V32LN",  "mw": 1.85},
            {"id": "DG12", "col_conso": 30, "col_rh": 31, "model": "12V32LN",  "mw": 1.85},
            {"id": "DG13", "col_conso": 32, "col_rh": 33, "model": "12V32LN",  "mw": 1.85},
        ],
        # Daily Data layout
        "dd_cols": {
            "date": 0, "gross_mwh": 1, "net_mwh": 2, "station_use": 3,
            "planned_maint": 4, "forced": 5, "standby": 6, "run": 7,
            "hfo_kgs": 8, "lfo": 9, "lube_oil": 10, "sfoc_gm": 11,
        },
        "has_dg_status": True,
        "dg_status_start": 15,
        # Oil sheet: Conso Total Formule column for filtering
        "oil_conso_total_col": 7,
        "oil_data_start_row": 13,
        # Blackout: date in col 1
        "blackout_date_col": 1,
        "blackout_data_start_row": 2,
        "blackout_cols": {
            "description": 2, "cause": 3, "source": 4,
            "start": 6, "end": 7, "duration": 8, "incharge": 9,
        },
        "oil_rh_is_time": False,
        # HFO daily report per-DG detail
        "hfo_detail": {
            "dg_header_row": 33,       # Row with DG1, DG2, … headers
            "data_start_row": 35,      # Row with "Engine condition"
            "desc_start_row": 13,      # First row with DG description (col 0 = "DG1 (…)")
            "desc_end_row": 28,        # Last row to search for DG descriptions
            "desc_col": 3,             # Column with description text
            "time_format": False,      # Tamatave uses decimal floats
        },
    },
    "diego": {
        "name": "Diego",
        "data_dir": os.path.join(BASE_DIR, "Diego"),
        "file_pattern": "Diego_2026_*.xlsx",
        "contrat": 12,
        "mw_per_dg": 1.2,
        "warn_threshold": 6,
        "prod_obj_24h": 9.2,
        "prod_obj_month": 220,
        "prod_obj_year": 2640,
        "prev2025": {
            "24h": {"prod": 9.0, "dispo": 96.2, "sfoc": 204, "sloc": 0.83},
            "month": {"prod": 218, "dispo": 96.0, "sfoc": 205, "sloc": 0.84},
            "year": {"prod": 2580, "dispo": 95.5, "sfoc": 206, "sloc": 0.85},
        },
        "num_engines": 10,
        "engine_map": [
            {"id": "DG1",  "col_conso": 6,  "col_rh": 7,  "model": "9L20",      "mw": 1.2},
            {"id": "DG2",  "col_conso": 8,  "col_rh": 9,  "model": "9L20",      "mw": 1.2},
            {"id": "DG3",  "col_conso": 10, "col_rh": 11, "model": "9L20",      "mw": 1.2},
            {"id": "DG4",  "col_conso": 12, "col_rh": 13, "model": "9L20",      "mw": 1.2},
            {"id": "DG5",  "col_conso": 14, "col_rh": 15, "model": "9L20",      "mw": 1.2},
            {"id": "DG6",  "col_conso": 16, "col_rh": 17, "model": "12V32STD",  "mw": 1.2},
            {"id": "DG7",  "col_conso": 18, "col_rh": 19, "model": "12V32STD",  "mw": 1.2},
            {"id": "DG8",  "col_conso": 20, "col_rh": 21, "model": "12V32LN",   "mw": 1.2},
            {"id": "DG9",  "col_conso": 22, "col_rh": 23, "model": "18V32LN",   "mw": 1.2},
            {"id": "DG10", "col_conso": 24, "col_rh": 25, "model": "12V32LN",   "mw": 1.2},
        ],
        # Daily Data layout — Diego has only 14 columns, no DG status
        "dd_cols": {
            "date": 0, "gross_mwh": 1, "net_mwh": 2, "station_use": 3,
            "planned_maint": 4, "forced": 5, "standby": 6, "run": 7,
            "hfo_kgs": 8, "lfo": 9, "lube_oil": 10, "sfoc_gm": 11,
        },
        "has_dg_status": False,
        "dg_status_start": None,
        # Oil sheet: Conso Total Formule column
        "oil_conso_total_col": 5,
        "oil_data_start_row": 13,
        # Blackout: date in col 1
        "blackout_date_col": 1,
        "blackout_data_start_row": 2,
        "blackout_cols": {
            "description": 2, "cause": 3, "source": 4,
            "start": 6, "end": 7, "duration": None, "incharge": 8,
        },
        "oil_rh_is_time": True,
        # HFO daily report per-DG detail
        "hfo_detail": {
            "dg_header_row": 27,       # Row with DG1, DG2, … headers
            "data_start_row": 29,      # Row with "Engine condition"
            "desc_start_row": 12,      # First row with DG description
            "desc_end_row": 22,        # Last row to search
            "desc_col": 3,             # Column with description text
            "time_format": True,       # Diego uses time strings / timedelta
        },
    },
}

# HFO density in kg/L for SFOC computation (liters → kg)
HFO_DENSITY = 0.96
# Lube oil density in kg/L for SLOC computation
OIL_DENSITY = 0.90


# ══════════════════════════════════════════════════════════════
# GENERIC LOADER
# ══════════════════════════════════════════════════════════════

def safe_float(v, default=0.0):
    try:
        f = float(v)
        return 0.0 if np.isnan(f) else f
    except (ValueError, TypeError):
        return default


def time_to_hours(v):
    """Convert time-formatted values (HH:MM:SS, timedelta, datetime, time) to decimal hours.

    Excel stores 24:00:00 as datetime(1900, 1, 1, 0, 0, 0) which we must
    interpret as 24 hours.  Normal time objects like time(23, 54) are
    converted directly.  timedelta objects are converted via total_seconds().
    """
    import datetime as _dt

    if pd.isna(v) or v == 0:
        return 0.0

    # --- timedelta (e.g. timedelta(hours=23, minutes=54)) ---
    if isinstance(v, (timedelta, pd.Timedelta)):
        return v.total_seconds() / 3600

    # --- datetime.time (e.g. time(23, 54)) ---
    if isinstance(v, _dt.time):
        return v.hour + v.minute / 60 + v.second / 3600

    # --- datetime / Timestamp ---
    # Excel represents 24:00:00 as 1900-01-01 00:00:00 (date = Jan 1, 1900)
    # and normal times as 1899-12-30 HH:MM:SS
    if isinstance(v, (datetime, pd.Timestamp)):
        ts = pd.Timestamp(v)
        if ts.year <= 1900:
            # 1900-01-01 00:00:00 means 24:00 (midnight = 24 hours)
            if ts.month == 1 and ts.day == 1 and ts.hour == 0 and ts.minute == 0:
                return 24.0
            # Otherwise extract time portion; for 1899-12-30 dates, just hours
            return ts.hour + ts.minute / 60 + ts.second / 3600
        # Modern datetime — just extract time part
        return ts.hour + ts.minute / 60 + ts.second / 3600

    # --- numeric ---
    if isinstance(v, (int, float)):
        f = float(v)
        return 0.0 if np.isnan(f) else f

    # --- string fallback (e.g. "23:54:00") ---
    s = str(v).strip()
    if s in ("0", "00:00:00", "0:00:00"):
        return 0.0
    try:
        parts = s.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        sec = int(parts[2]) if len(parts) > 2 else 0
        return h + m / 60 + sec / 3600
    except (ValueError, IndexError):
        return safe_float(v)


def dg_status_to_code(s):
    s = str(s).lower().strip()
    if s in ("running", "working"):
        return "ok"
    elif s in ("stop", "stopped", "standby", "st/by", "standyby"):
        return "standby"
    elif s in ("maintenance",):
        return "warn"
    elif s in ("breakdown", "br/do", "break down"):
        return "ko"
    else:
        return "ko"


def dg_condition(s):
    s = str(s).strip()
    sl = s.lower()
    if sl in ("running", "working"):
        return "Running"
    elif sl == "maintenance":
        return "Maintenance"
    elif sl in ("breakdown", "br/do", "break down"):
        return "Breakdown"
    elif sl in ("standby", "st/by", "standyby"):
        return "Standby"
    elif sl in ("stop", "stopped"):
        return "Stopped"
    return s


def parse_hfo_detail(xls, cfg):
    """Extract per-DG detail from the latest HFO specific data sheet.

    Returns a dict keyed by DG id (e.g. "DG1") with fields:
        condition, description, h_cumul, hToday, hStandby,
        arretForce, arretPlanifie, maxLoad, energieProd, consLVMV,
        consoHFO, consoLFO, oilTopUp, oilConso, oilSumpLevel,
        lubeOilPressure, fuelOilTemp
    """
    hfo_cfg = cfg.get("hfo_detail")
    if not hfo_cfg:
        return {}

    # Find the latest HFO specific data sheet that has actual data.
    # Sheets 01-31 exist as templates but only filled ones have useful data.
    sheet_names = xls.sheet_names
    data_start = hfo_cfg["data_start_row"]
    latest_sheet = None
    df = None
    for day in range(31, 0, -1):
        sn = f"HFO specific data {day:02d}"
        if sn in sheet_names:
            candidate = pd.read_excel(xls, sheet_name=sn, header=None)
            # Check if the condition row (data_start_row) has any non-NaN
            # values in columns 3+ (the DG data columns)
            if data_start < len(candidate):
                row_data = candidate.iloc[data_start, 3:]
                if row_data.notna().any():
                    latest_sheet = sn
                    df = candidate
                    break
    if df is None:
        return {}
    use_time = hfo_cfg.get("time_format", False)

    # ── Map DG columns from header row ──
    header_row = hfo_cfg["dg_header_row"]
    if header_row >= len(df):
        return {}

    dg_col_map = {}  # "DG1" → column index
    for col_idx in range(df.shape[1]):
        val = df.iloc[header_row, col_idx]
        if pd.notna(val):
            s = str(val).strip().upper()
            # Match DG1, DG2, ..., DG13 (ignore TOTAL, CUMMINS, etc.)
            if s.startswith("DG") and len(s) <= 5:
                try:
                    dg_num = int(s[2:])
                    dg_id = f"DG{dg_num}"
                    dg_col_map[dg_id] = col_idx
                except ValueError:
                    pass

    if not dg_col_map:
        return {}

    # ── Data rows (offsets from data_start_row) ──
    dr = hfo_cfg["data_start_row"]
    ROW_OFFSETS = {
        "condition":       0,
        "h_cumul":         1,
        "hToday":          2,
        "hStandby":        3,
        "arretForce":      4,
        "arretPlanifie":   5,
        "maxLoad":         6,
        "energieProd":     7,
        "consLVMV":        8,
        "consoHFO":        9,
        "consoLFO":        10,
        "oilTopUp":        11,
        "oilConso":        12,
        "oilSumpLevel":    13,
        "lubeOilPressure": 14,
        "fuelOilTemp":     15,
    }

    # ── Parse DG descriptions ──
    desc_map = {}  # "DG1" → "Running Normal: Fuel rack lubricate..."
    desc_start = hfo_cfg.get("desc_start_row", 12)
    desc_end = hfo_cfg.get("desc_end_row", 30)
    desc_col = hfo_cfg.get("desc_col", 3)
    for row_idx in range(desc_start, min(desc_end, len(df))):
        cell0 = df.iloc[row_idx, 0]
        if pd.notna(cell0):
            s0 = str(cell0).strip()
            # Match rows like "DG1 (9L20)", "DG2 (9L20)", etc.
            if s0.upper().startswith("DG"):
                # Extract DG number
                parts = s0.split("(")[0].strip().split()
                dg_label = parts[0].upper().replace(" ", "")
                try:
                    dg_num = int(dg_label[2:])
                    dg_id = f"DG{dg_num}"
                    desc_val = df.iloc[row_idx, desc_col]
                    if pd.notna(desc_val):
                        desc_map[dg_id] = str(desc_val).strip()
                except (ValueError, IndexError):
                    pass

    # ── Build per-DG result ──
    result = {}
    for dg_id, col_idx in dg_col_map.items():
        dg_data = {}

        for field, offset in ROW_OFFSETS.items():
            row_idx = dr + offset
            if row_idx >= len(df) or col_idx >= df.shape[1]:
                dg_data[field] = 0.0 if field != "condition" else "Unknown"
                continue

            val = df.iloc[row_idx, col_idx]

            if field == "condition":
                dg_data[field] = str(val).strip() if pd.notna(val) else "Unknown"
            elif field in ("hToday", "hStandby", "arretForce", "arretPlanifie") and use_time:
                # Diego uses time/timedelta format for hours
                dg_data[field] = time_to_hours(val)
            else:
                dg_data[field] = safe_float(val)

        # Add description
        dg_data["description"] = desc_map.get(dg_id, "")

        result[dg_id] = dg_data

    return result


def load_site_files(cfg):
    """Load all xlsx files for a site and return combined DataFrames."""
    data_dir = cfg["data_dir"]
    pattern = os.path.join(data_dir, cfg["file_pattern"])
    files = sorted(glob.glob(pattern))
    if not files:
        return None

    all_daily = []
    all_oil = []
    all_blackout = []

    for fpath in files:
        xls = pd.ExcelFile(fpath)

        # --- Daily Data ---
        dd = pd.read_excel(xls, sheet_name="Daily Data", header=None)
        dd_data = dd.iloc[4:].copy()
        dd_data = dd_data[dd_data.iloc[:, 0].apply(
            lambda x: isinstance(x, (datetime, pd.Timestamp))
        )]
        all_daily.append(dd_data)

        # --- Specific data oil ---
        oil = pd.read_excel(xls, sheet_name="Specific data oil", header=None)
        oil_start = cfg["oil_data_start_row"]
        oil_data = oil.iloc[oil_start:].copy()
        # Filter to actual day rows only (1-31 or valid Timestamps).
        # Excludes TOTAL/AVERAGE summary rows that have higher indices or text.
        def _is_valid_oil_day(x):
            if isinstance(x, (datetime, pd.Timestamp)):
                return True
            if isinstance(x, (int, float)):
                try:
                    n = int(x)
                    return 1 <= n <= 31
                except (ValueError, OverflowError):
                    return False
            return False
        oil_data = oil_data[oil_data.iloc[:, 0].apply(_is_valid_oil_day)]
        all_oil.append(oil_data)

        # --- Blackout ---
        bo = pd.read_excel(xls, sheet_name="Blackout", header=None)
        bo_start = cfg["blackout_data_start_row"]
        bo_date_col = cfg["blackout_date_col"]
        bo_data = bo.iloc[bo_start:].copy()
        bo_data = bo_data[bo_data.iloc[:, bo_date_col].apply(
            lambda x: isinstance(x, (datetime, pd.Timestamp))
        )]
        all_blackout.append(bo_data)

    daily_df = pd.concat(all_daily, ignore_index=True) if all_daily else pd.DataFrame()
    oil_df = pd.concat(all_oil, ignore_index=True) if all_oil else pd.DataFrame()
    blackout_df = pd.concat(all_blackout, ignore_index=True) if all_blackout else pd.DataFrame()

    # --- HFO per-DG detail from the latest xlsx file ---
    hfo_detail = {}
    if files:
        latest_xls = pd.ExcelFile(files[-1])
        hfo_detail = parse_hfo_detail(latest_xls, cfg)

    return daily_df, oil_df, blackout_df, hfo_detail


def build_site_data(site_key):
    """Build the siteData object for a given site from xlsx files."""
    cfg = SITE_CONFIG[site_key]
    result = load_site_files(cfg)
    if result is None:
        return None

    daily_df, oil_df, blackout_df, hfo_detail = result
    dd = cfg["dd_cols"]
    num_eng = cfg["num_engines"]

    if daily_df.empty:
        return None

    # Filter out rows with zero production (future/empty dates)
    daily_df = daily_df[daily_df.iloc[:, dd["gross_mwh"]].apply(safe_float) > 0]
    if not oil_df.empty:
        oil_conso_col = cfg["oil_conso_total_col"]
        oil_df = oil_df[oil_df.iloc[:, oil_conso_col].apply(safe_float) > 0]

    if daily_df.empty:
        return None

    # --- Latest day data ---
    latest = daily_df.iloc[-1]
    latest_date = pd.Timestamp(latest.iloc[dd["date"]])

    # --- Latest oil row ---
    latest_oil = oil_df.iloc[-1] if not oil_df.empty else None

    # --- DG statuses (only Tamatave has them in Daily Data) ---
    status_map_raw = {}
    if cfg["has_dg_status"]:
        dg_start = cfg["dg_status_start"]
        for i in range(num_eng):
            col_idx = dg_start + i
            if col_idx < len(latest):
                val = latest.iloc[col_idx]
                status_map_raw[f"DG{i+1}"] = str(val) if pd.notna(val) else "Unknown"

    # --- Build per-engine data ---
    groupes = []
    for eng in cfg["engine_map"]:
        dg_id = eng["id"]

        # Get oil data
        oil_conso = 0.0
        oil_rh = 0.0
        if latest_oil is not None:
            oil_conso = safe_float(latest_oil.iloc[eng["col_conso"]])
            if cfg.get("oil_rh_is_time"):
                oil_rh = time_to_hours(latest_oil.iloc[eng["col_rh"]])
            else:
                oil_rh = safe_float(latest_oil.iloc[eng["col_rh"]])

        # Determine status
        if cfg["has_dg_status"]:
            raw_status = status_map_raw.get(dg_id, "Unknown")
            statut = dg_status_to_code(raw_status)
            condition = dg_condition(raw_status)
        else:
            # No DG status in sheet — infer from oil running hours
            if oil_rh > 0:
                statut = "ok"
                condition = "Running"
            else:
                statut = "standby"
                condition = "Standby"

        # ── Merge HFO daily report detail (richer data) ──
        hd = hfo_detail.get(dg_id, {})

        # Override status from HFO detail if available (more accurate)
        if hd.get("condition"):
            raw_cond = hd["condition"]
            statut = dg_status_to_code(raw_cond)
            condition = dg_condition(raw_cond)

        # Hours and stoppages
        h_cumul = hd.get("h_cumul", 0.0)
        h_today = hd.get("hToday", oil_rh)
        h_standby = hd.get("hStandby", 0.0)
        arret_force = hd.get("arretForce", 24.0 if condition == "Breakdown" else 0.0)
        arret_planifie = hd.get("arretPlanifie", 24.0 if condition == "Maintenance" else 0.0)

        # Production & load
        max_load = hd.get("maxLoad", 0.0)
        energie_prod = hd.get("energieProd", 0.0)
        cons_lvmv = hd.get("consLVMV", 0.0)

        # Fuel
        conso_hfo = hd.get("consoHFO", 0.0)
        conso_lfo = hd.get("consoLFO", 0.0)

        # Oil — prefer HFO detail, fall back to oil sheet
        oil_topup = hd.get("oilTopUp", oil_conso)
        oil_conso_val = hd.get("oilConso", oil_conso)
        oil_sump = hd.get("oilSumpLevel", 0.0)
        lube_pressure = hd.get("lubeOilPressure", 0.0)
        fuel_temp = hd.get("fuelOilTemp", 0.0)

        # Compute per-DG SFOC and SLOC
        dg_sfoc = None
        dg_sloc = None
        if energie_prod > 0:
            dg_sfoc = round((conso_hfo * HFO_DENSITY) / energie_prod * 1000, 1)
            if oil_conso_val > 0:
                dg_sloc = round((oil_conso_val * OIL_DENSITY) / energie_prod * 1000, 2)

        # Description / maintenance note
        desc = hd.get("description", "")
        if desc:
            maint_label = desc
        elif condition != "Running":
            maint_label = condition
        else:
            maint_label = "Running normal"

        # ── Contradictory data detection ──
        # Flag when status and operational data don't match:
        #   - Says not-running but has significant runtime or production
        #   - Says running but no runtime and no production
        contradictory = False
        if statut != "ok" and (h_today > 1 or energie_prod > 100):
            contradictory = True  # labelled stopped/standby but actually producing
        elif statut == "ok" and h_today == 0 and energie_prod == 0:
            contradictory = True  # labelled running but no output

        groupe = {
            "id": dg_id,
            "model": eng["model"],
            "mw": eng["mw"],
            "statut": statut,
            "condition": condition,
            "contradictory": contradictory,
            "jourArret": 0 if statut == "ok" else 1,
            "h": round(h_cumul, 1),
            "hToday": round(h_today, 1),
            "hStandby": round(h_standby, 1),
            "arretForce": round(arret_force, 1),
            "arretPlanifie": round(arret_planifie, 1),
            "maxLoad": round(max_load),
            "energieProd": round(energie_prod, 1),
            "consLVMV": round(cons_lvmv),
            "consoHFO": round(conso_hfo, 1),
            "consoLFO": round(conso_lfo, 1),
            "oilTopUp": round(oil_topup, 1),
            "oilConso": round(oil_conso_val, 1),
            "oilSumpLevel": round(oil_sump, 1),
            "lubeOilPressure": round(lube_pressure, 1),
            "fuelOilTemp": round(fuel_temp),
            "sfoc": dg_sfoc,
            "sloc": dg_sloc,
            "maint": maint_label,
            "hourlyLoad": [0] * 24,
        }
        groupes.append(groupe)

    # --- Compute KPIs ---
    def compute_kpi(df_slice, num_days):
        net = df_slice.iloc[:, dd["net_mwh"]].apply(safe_float).sum()
        hfo = df_slice.iloc[:, dd["hfo_kgs"]].apply(safe_float).sum()
        lube = df_slice.iloc[:, dd["lube_oil"]].apply(safe_float).sum()
        run = df_slice.iloc[:, dd["run"]].apply(safe_float).sum()
        prod = net / 1000
        sfoc = round(hfo * 1000 / net, 1) if net > 0 else None
        sloc = round(lube / net * 1000, 2) if net > 0 else None
        dispo = round(run / (num_eng * 24 * num_days) * 100, 1) if num_days > 0 else 0
        return prod, run, sfoc, sloc, dispo

    # 24h
    last_row = daily_df.iloc[[-1]]
    prod_24h, run_24h, sfoc_24h, sloc_24h, dispo_24h = compute_kpi(last_row, 1)

    # Month
    now = latest_date
    month_mask = daily_df.iloc[:, dd["date"]].apply(
        lambda x: isinstance(x, (datetime, pd.Timestamp)) and
        pd.Timestamp(x).month == now.month and pd.Timestamp(x).year == now.year
    )
    month_df = daily_df[month_mask]
    prod_month, run_month, sfoc_month, sloc_month, dispo_month = compute_kpi(month_df, len(month_df))

    # Year
    year_mask = daily_df.iloc[:, dd["date"]].apply(
        lambda x: isinstance(x, (datetime, pd.Timestamp)) and pd.Timestamp(x).year == now.year
    )
    year_df = daily_df[year_mask]
    prod_year, run_year, sfoc_year, sloc_year, dispo_year = compute_kpi(year_df, len(year_df))

    # Total running MW
    running_count = sum(1 for g in groupes if g["statut"] == "ok")
    mw_total = round(running_count * cfg["mw_per_dg"], 1)

    # Site status
    if running_count == 0:
        site_status = "ko"
    elif running_count < cfg["warn_threshold"]:
        site_status = "warn"
    else:
        site_status = "ok"

    # --- Blackout data ---
    blackout_events = []
    bo_cols = cfg["blackout_cols"]
    bo_date_col = cfg["blackout_date_col"]
    for _, row in blackout_df.iterrows():
        try:
            event = {
                "date": str(pd.Timestamp(row.iloc[bo_date_col]).date()),
                "description": str(row.iloc[bo_cols["description"]]) if pd.notna(row.iloc[bo_cols["description"]]) else "",
                "cause": str(row.iloc[bo_cols["cause"]]) if pd.notna(row.iloc[bo_cols["cause"]]) else "",
                "source": str(row.iloc[bo_cols["source"]]) if pd.notna(row.iloc[bo_cols["source"]]) else "",
                "start": str(row.iloc[bo_cols["start"]]) if pd.notna(row.iloc[bo_cols["start"]]) else "",
                "end": str(row.iloc[bo_cols["end"]]) if pd.notna(row.iloc[bo_cols["end"]]) else "",
            }
            if bo_cols.get("duration") is not None:
                event["duration"] = str(row.iloc[bo_cols["duration"]]) if pd.notna(row.iloc[bo_cols["duration"]]) else ""
            if bo_cols.get("incharge") is not None:
                event["incharge"] = str(row.iloc[bo_cols["incharge"]]) if pd.notna(row.iloc[bo_cols["incharge"]]) else ""
            blackout_events.append(event)
        except Exception:
            continue

    # --- Daily trend ---
    daily_trend = []
    for _, row in daily_df.iterrows():
        try:
            d = pd.Timestamp(row.iloc[dd["date"]])
            daily_trend.append({
                "date": str(d.date()),
                "gross_mwh": round(safe_float(row.iloc[dd["gross_mwh"]]) / 1000, 1),
                "net_mwh": round(safe_float(row.iloc[dd["net_mwh"]]) / 1000, 1),
                "hfo_kgs": round(safe_float(row.iloc[dd["hfo_kgs"]])),
                "lube_oil": round(safe_float(row.iloc[dd["lube_oil"]]), 1),
                "run_hours": round(safe_float(row.iloc[dd["run"]]), 1),
                "standby": round(safe_float(row.iloc[dd["standby"]]), 1),
            })
        except Exception:
            continue

    return {
        "name": cfg["name"],
        "status": site_status,
        "mw": mw_total,
        "contrat": cfg["contrat"],
        "latestDate": str(latest_date.date()),
        "groupes": groupes,
        "kpi": {
            "24h": {
                "prod": round(prod_24h, 1), "prodObj": cfg["prod_obj_24h"],
                "dispo": dispo_24h, "heures": round(run_24h, 1),
                "sfoc": sfoc_24h, "sloc": sloc_24h,
            },
            "month": {
                "prod": round(prod_month, 1), "prodObj": cfg["prod_obj_month"],
                "dispo": dispo_month, "heures": round(run_month, 1),
                "sfoc": sfoc_month, "sloc": sloc_month,
            },
            "year": {
                "prod": round(prod_year, 1), "prodObj": cfg["prod_obj_year"],
                "dispo": dispo_year, "heures": round(run_year, 1),
                "sfoc": sfoc_year, "sloc": sloc_year,
            },
        },
        "prev2025": cfg["prev2025"],
        "blackouts": blackout_events,
        "dailyTrend": daily_trend,
    }


# Backward compatibility
def build_tamatave_data():
    return build_site_data("tamatave")


def build_diego_data():
    return build_site_data("diego")


if __name__ == "__main__":
    import json
    for site in ["tamatave", "diego"]:
        data = build_site_data(site)
        if data:
            print(f"=== {site.upper()} ===")
            print(f"  Status: {data['status']}, MW: {data['mw']}")
            print(f"  Engines: {len(data['groupes'])} ({sum(1 for g in data['groupes'] if g['statut'] == 'ok')} running)")
            print(f"  KPI month: prod={data['kpi']['month']['prod']} MWh, sfoc={data['kpi']['month']['sfoc']}")
            print(f"  Trend: {len(data['dailyTrend'])} days, Blackouts: {len(data['blackouts'])}")
            print()
        else:
            print(f"=== {site.upper()} === No data found\n")
