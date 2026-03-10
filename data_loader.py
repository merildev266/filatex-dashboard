"""
Loads Tamatave and Diego xlsx daily reports and transforms them into the
siteData format expected by the Filatex PMO Dashboard frontend.
"""
import os
import re
import glob
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "01_Energy",
    "Production",
    "HFO",
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
            # Load table / chart (kW) section
            "load_dg_header_row": 84,  # Row with DG1, DG2, … in load table
            "load_data_start_row": 86, # First hourly data row (07:00)
            "load_data_end_row": 109,  # Last hourly data row (06:00)
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
            # Load table / chart (kW) section
            "load_dg_header_row": 68,  # Row with DG1, DG2, … in load table
            "load_data_start_row": 70, # First hourly data row (07:00)
            "load_data_end_row": 83,   # Last hourly data row (06:00)
        },
    },
    "majunga": {
        "name": "Majunga",
        "data_dir": os.path.join(BASE_DIR, "Majunga"),
        "file_pattern": "Majunga_2026_*.xlsx",
        "contrat": 10,
        "mw_per_dg": 2.0,
        "warn_threshold": 3,
        "prod_obj_24h": 8.0,
        "prod_obj_month": 190,
        "prod_obj_year": 2280,
        "prev2025": {
            "24h": {"prod": 7.5, "dispo": 94.0, "sfoc": 210, "sloc": 0.90},
            "month": {"prod": 185, "dispo": 93.5, "sfoc": 211, "sloc": 0.91},
            "year": {"prod": 2200, "dispo": 93.0, "sfoc": 212, "sloc": 0.92},
        },
        "num_engines": 5,
        "engine_map": [
            {"id": "DG1", "col_conso": 12, "col_rh": 13, "model": "18V32-E",   "mw": 2.0},
            {"id": "DG2", "col_conso": 14, "col_rh": 15, "model": "18V32 LNx", "mw": 2.0},
            {"id": "DG3", "col_conso": 16, "col_rh": 17, "model": "9R32 LNx",  "mw": 2.0},
            {"id": "DG4", "col_conso": 18, "col_rh": 19, "model": "12V32LN",   "mw": 2.0},
            {"id": "DG5", "col_conso": 20, "col_rh": 21, "model": "9R32D",     "mw": 2.0},
        ],
        # Majunga uses "Brief data" instead of "Daily Data"
        "daily_data_sheet": "Brief data",
        "dd_data_start_row": 3,
        "dd_cols": {
            "date": 0, "gross_mwh": 1, "net_mwh": 2, "station_use": 3,
            "planned_maint": 4, "forced": 5, "standby": 6, "run": 7,
            "hfo_kgs": 8, "lfo": 9, "lube_oil": 10, "sfoc_gm": 11,
        },
        "hfo_is_liters": True,   # Majunga HFO column is liters, not kgs
        "dd_energy_in_mwh": True,  # Majunga Brief data has energy in MWh (not kWh)
        "has_dg_status": False,
        "dg_status_start": None,
        # Oil sheet
        "oil_conso_total_col": 11,
        "oil_data_start_row": 13,
        # Blackout — Majunga uses "Black out" (with space)
        "blackout_sheet": "Black out",
        "blackout_date_col": 1,
        "blackout_data_start_row": 2,
        "blackout_cols": {
            "description": 2, "cause": 3, "source": 4,
            "start": 5, "end": 6, "duration": 7, "incharge": 8,
        },
        "oil_rh_is_time": False,
        # HFO daily report per-DG detail
        "hfo_detail": {
            "dg_header_row": 25,       # Row with DG1, DG2, … headers
            "data_start_row": 27,      # Row with "Engine condition"
            "desc_start_row": 18,
            "desc_end_row": 23,
            "desc_col": 3,
            "time_format": True,       # Majunga uses timedelta
            # Load table / chart (kW) section
            "load_dg_header_row": 58,
            "load_data_start_row": 60,
            "load_data_end_row": 83,
        },
    },
    "tulear": {
        "name": "Tuléar",
        "data_dir": os.path.join(BASE_DIR, "Tulera"),
        "file_pattern": "Tulear_2026_*.xlsx",
        "contrat": 11.5,
        "mw_per_dg": 3.5,  # average (DGs have different MW)
        "warn_threshold": 2,
        "prod_obj_24h": 9.0,
        "prod_obj_month": 200,
        "prod_obj_year": 2400,
        "prev2025": {
            "24h": {"prod": 8.0, "dispo": 93.0, "sfoc": 245, "sloc": 1.90},
            "month": {"prod": 190, "dispo": 92.0, "sfoc": 246, "sloc": 1.91},
            "year": {"prod": 2280, "dispo": 91.5, "sfoc": 247, "sloc": 1.92},
        },
        "num_engines": 4,
        "engine_map": [
            {"id": "DG1", "col_conso": None, "col_rh": None, "model": "12V32 SLN", "mw": 0},
            {"id": "DG2", "col_conso": None, "col_rh": None, "model": "16V32 STD", "mw": 3.5},
            {"id": "DG3", "col_conso": None, "col_rh": None, "model": "16V32 SLN", "mw": 3.5},
            {"id": "DG4", "col_conso": None, "col_rh": None, "model": "16V32 SLN", "mw": 4.5},
        ],
        "daily_data_sheet": "DAILY DATA",
        "dd_data_start_row": 4,
        "dd_hours_as_time": True,   # hours columns have timedelta values
        "dd_cols": {
            "date": 0, "gross_mwh": 1, "net_mwh": 2, "station_use": 3,
            "planned_maint": 4, "forced": 5, "standby": 6, "run": 7,
            "hfo_kgs": 8, "lfo": 9, "lube_oil": 10, "sfoc_gm": 11,
        },
        "hfo_is_liters": True,     # HFO column is in liters
        "has_dg_status": False,
        "dg_status_start": None,
        # No "Specific data oil" sheet in Tulear
        "oil_sheet": None,
        "oil_conso_total_col": None,
        "oil_data_start_row": None,
        # Blackout
        "blackout_sheet": "BLACK OUT",
        "blackout_date_col": 1,
        "blackout_data_start_row": 3,
        "blackout_cols": {
            "description": 2, "cause": 9, "source": None,
            "start": 3, "end": 4, "duration": 5, "incharge": 6,
        },
        "oil_rh_is_time": False,
        # HFO daily report per-DG detail
        "hfo_detail": {
            "dg_header_row": 20,       # Row with DG1, DG2, … headers
            "data_start_row": 23,      # h_cumul row (no condition row above it)
            "has_condition_row": False, # No "Engine condition" row
            "data_check_offset": 1,    # Check hToday (row 24) for data presence
            "row_offsets": {
                "h_cumul":         0,
                "hToday":          1,
                "hStandby":        2,
                "arretForce":      3,
                "arretPlanifie":   4,
                "maxLoad":         5,
                "energieProd":     6,
                # Row 7 is LFO kWh (extra row, skipped)
                "consLVMV":        8,
                "consoHFO":        9,
                "consoLFO":        10,
                "oilTopUp":        11,
                "oilConso":        12,
                "oilSumpLevel":    13,
                "lubeOilPressure": 14,
                "fuelOilTemp":     15,
            },
            "desc_start_row": 12,
            "desc_end_row": 16,
            "desc_col": 3,
            "time_format": True,
            # Load table / chart (kW) — no DG1 in load chart
            "load_dg_header_row": 56,
            "load_data_start_row": 58,
            "load_data_end_row": 81,
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


def find_hfo_sheets(sheet_names):
    """Find HFO specific data sheets regardless of naming convention.

    Supports:
      - "HFO specific data 01" ... "HFO specific data 31"  (Tamatave, Diego)
      - "HFO Specific data DD.MM.YYYY"                      (Majunga)

    Returns list of (day_number, sheet_name) sorted by day.
    """
    results = []
    for sn in sheet_names:
        sl = sn.lower().strip()
        if not sl.startswith("hfo specific data"):
            continue
        rest = sn.strip()[len("HFO specific data"):].strip()
        if not rest:
            rest = sn.strip()[len("HFO Specific data"):].strip()
        # Pattern 1: just a day number "01" - "31"
        m = re.match(r'^(\d{1,2})$', rest)
        if m:
            results.append((int(m.group(1)), sn))
            continue
        # Pattern 2: DD.MM.YYYY date format
        m = re.match(r'^(\d{1,2})\.\d{2}\.\d{4}$', rest)
        if m:
            results.append((int(m.group(1)), sn))
            continue
    results.sort(key=lambda x: x[0])
    return results


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
    check_offset = hfo_cfg.get("data_check_offset", 0)
    check_row = data_start + check_offset
    latest_sheet = None
    df = None
    hfo_sheets = find_hfo_sheets(sheet_names)
    for day, sn in reversed(hfo_sheets):
        candidate = pd.read_excel(xls, sheet_name=sn, header=None)
        # Check if the data/condition row has meaningful non-empty values
        if check_row < len(candidate):
            row_data = candidate.iloc[check_row, 3:]
            has_data = row_data.apply(
                lambda x: pd.notna(x) and str(x).strip() not in
                ('', '0', '0:00:00', '0 days 00:00:00', 'TBC', 'nan')
            ).any()
            if has_data:
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
    has_condition = hfo_cfg.get("has_condition_row", True)

    # Use configurable row_offsets if provided, else defaults
    ROW_OFFSETS = hfo_cfg.get("row_offsets", _DEFAULT_OFFSETS)
    # If custom offsets don't include condition and site has no condition row,
    # make sure condition is absent
    if not has_condition and "condition" in ROW_OFFSETS:
        ROW_OFFSETS = {k: v for k, v in ROW_OFFSETS.items() if k != "condition"}

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
                # Extract DG number (handles DG1, DG#01, DG 1, etc.)
                parts = s0.split("(")[0].strip().split()
                dg_label = parts[0].upper().replace(" ", "").replace("#", "")
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

        # If no condition row, set default
        if not has_condition:
            dg_data["condition"] = ""

        for field, offset in ROW_OFFSETS.items():
            row_idx = dr + offset
            if row_idx >= len(df) or col_idx >= df.shape[1]:
                dg_data[field] = 0.0 if field != "condition" else "Unknown"
                continue

            val = df.iloc[row_idx, col_idx]

            if field == "condition":
                dg_data[field] = str(val).strip() if pd.notna(val) else "Unknown"
            elif field in ("hToday", "hStandby", "arretForce", "arretPlanifie") and use_time:
                # Diego/Majunga/Tulear uses time/timedelta format for hours
                dg_data[field] = time_to_hours(val)
            else:
                dg_data[field] = safe_float(val)

        # Add description
        dg_data["description"] = desc_map.get(dg_id, "")

        result[dg_id] = dg_data

    # ── Parse hourly load data from the same sheet ──
    hourly_loads = parse_hourly_load(df, hfo_cfg)
    for dg_id, loads in hourly_loads.items():
        if dg_id in result:
            result[dg_id]["hourlyLoad"] = loads

    return result


def parse_hourly_load(df, hfo_cfg):
    """Extract per-DG hourly kW load from one HFO specific data sheet.

    Returns dict of DG id -> 24-element list (index 0 = 07:00, index 23 = 06:00).
    """
    load_start = hfo_cfg.get("load_data_start_row")
    load_end = hfo_cfg.get("load_data_end_row")
    load_dg_row = hfo_cfg.get("load_dg_header_row")
    if load_start is None or load_end is None or load_dg_row is None:
        return {}
    if load_dg_row >= len(df) or load_end >= len(df):
        return {}

    # Build DG column map from load table header row
    dg_col_map = {}
    for col_idx in range(df.shape[1]):
        val = df.iloc[load_dg_row, col_idx]
        if pd.notna(val):
            s = str(val).strip().upper()
            if s.startswith("DG") and len(s) <= 5:
                try:
                    dg_num = int(s[2:])
                    dg_col_map[f"DG{dg_num}"] = col_idx
                except ValueError:
                    pass

    if not dg_col_map:
        return {}

    result = {dg_id: [0.0] * 24 for dg_id in dg_col_map}

    for row_idx in range(load_start, min(load_end + 1, len(df))):
        time_val = df.iloc[row_idx, 0]
        if pd.isna(time_val):
            continue
        s_val = str(time_val).strip().lower()
        if s_val in ('max', 'maximum', 'total'):
            continue

        # Convert time to integer hour (0-23)
        h = time_to_hours(time_val)
        hour = int(h) % 24
        # Map to chart index: 07h=0, 08h=1, ..., 23h=16, 00h=17, ..., 06h=23
        idx = (hour - 7) % 24

        for dg_id, col_idx in dg_col_map.items():
            kw = safe_float(df.iloc[row_idx, col_idx])
            result[dg_id][idx] = round(kw, 1)

    return result


DAILY_EXTRACT_METRICS = [
    'hToday', 'hStandby', 'arretForce', 'arretPlanifie',
    'maxLoad', 'energieProd', 'consLVMV',
    'consoHFO', 'consoLFO', 'oilTopUp', 'oilConso',
]
DAILY_TIME_FIELDS = {'hToday', 'hStandby', 'arretForce', 'arretPlanifie'}

# Default row offsets (shared with parse_hfo_detail)
_DEFAULT_OFFSETS = {
    "condition": 0, "h_cumul": 1, "hToday": 2, "hStandby": 3,
    "arretForce": 4, "arretPlanifie": 5, "maxLoad": 6, "energieProd": 7,
    "consLVMV": 8, "consoHFO": 9, "consoLFO": 10, "oilTopUp": 11,
    "oilConso": 12, "oilSumpLevel": 13, "lubeOilPressure": 14, "fuelOilTemp": 15,
}


def collect_daily_dg_metrics(xls, cfg):
    """Collect ALL per-DG daily metrics from all HFO sheets in one xlsx file.

    Returns ({DG_id: {metric: [31 daily values]}}, num_days).
    Metrics: hToday, hStandby, arretForce, arretPlanifie, maxLoad,
             energieProd, consLVMV, consoHFO, consoLFO, oilTopUp, oilConso.
    """
    hfo_cfg = cfg.get("hfo_detail")
    if not hfo_cfg:
        return {}, 0

    dg_header_row = hfo_cfg["dg_header_row"]
    data_start = hfo_cfg["data_start_row"]
    row_offsets = hfo_cfg.get("row_offsets", _DEFAULT_OFFSETS)
    use_time = hfo_cfg.get("time_format", False)
    check_offset = hfo_cfg.get("data_check_offset", 0)

    result = {}
    dg_col_map = {}
    num_days = 0

    hfo_sheets = find_hfo_sheets(xls.sheet_names)
    for day, sn in hfo_sheets:
        df = pd.read_excel(xls, sheet_name=sn, header=None)

        # Build DG col map once from first valid sheet
        if not dg_col_map:
            for col_idx in range(df.shape[1]):
                val = df.iloc[dg_header_row, col_idx] if dg_header_row < len(df) else None
                if pd.notna(val):
                    s = str(val).strip().upper()
                    if s.startswith("DG") and len(s) <= 5:
                        try:
                            dg_num = int(s[2:])
                            dg_id = f"DG{dg_num}"
                            dg_col_map[dg_id] = col_idx
                            result[dg_id] = {m: [0.0] * 31 for m in DAILY_EXTRACT_METRICS}
                        except ValueError:
                            pass
            if not dg_col_map:
                return {}, 0

        # Check if day has actual data
        check_row_idx = data_start + check_offset
        if check_row_idx < len(df):
            cond_row = df.iloc[check_row_idx]
            if not cond_row.iloc[3:].apply(
                lambda x: pd.notna(x) and str(x).strip() not in
                ('', '0', '0:00:00', '0 days 00:00:00', 'TBC', 'nan')
            ).any():
                continue
        else:
            continue

        num_days = max(num_days, day)

        for metric in DAILY_EXTRACT_METRICS:
            offset = row_offsets.get(metric)
            if offset is None:
                continue
            metric_row = data_start + offset
            if metric_row >= len(df):
                continue
            for dg_id, col_idx in dg_col_map.items():
                if col_idx >= df.shape[1]:
                    continue
                raw = df.iloc[metric_row, col_idx]
                if metric in DAILY_TIME_FIELDS and use_time:
                    val = time_to_hours(raw)
                else:
                    val = safe_float(raw)
                result[dg_id][metric][day - 1] = round(val, 1)

    return result, num_days


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
        try:
            xls = pd.ExcelFile(fpath)
        except PermissionError:
            print(f"  ⚠ Fichier verrouillé (ouvert dans Excel ?), ignoré : {os.path.basename(fpath)}")
            continue

        # --- Daily Data ---
        dd_sheet = cfg.get("daily_data_sheet", "Daily Data")
        dd_start = cfg.get("dd_data_start_row", 4)
        dd = pd.read_excel(xls, sheet_name=dd_sheet, header=None)
        dd_data = dd.iloc[dd_start:].copy()
        dd_data = dd_data[dd_data.iloc[:, 0].apply(
            lambda x: isinstance(x, (datetime, pd.Timestamp))
        )]
        all_daily.append(dd_data)

        # --- Specific data oil ---
        oil_sheet_name = cfg.get("oil_sheet", "Specific data oil")
        if oil_sheet_name:
            oil = pd.read_excel(xls, sheet_name=oil_sheet_name, header=None)
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
        bo_sheet = cfg.get("blackout_sheet", "Blackout")
        bo = pd.read_excel(xls, sheet_name=bo_sheet, header=None)
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
    for fpath in reversed(files):
        try:
            latest_xls = pd.ExcelFile(fpath)
            hfo_detail = parse_hfo_detail(latest_xls, cfg)
            break
        except PermissionError:
            print(f"  ⚠ HFO detail: fichier verrouillé, essai fichier précédent : {os.path.basename(fpath)}")
            continue

    # --- Collect daily per-DG metrics for each month (all metrics) ---
    monthly_dg_metrics = {}  # {month_num: {DG_id: {metric: [31 daily values]}}}
    for fpath in files:
        try:
            month_xls = pd.ExcelFile(fpath)
            # Extract month from filename (e.g., "Diego_2026_03.xlsx" -> 3)
            basename = os.path.basename(fpath)
            parts = basename.replace('.xlsx', '').split('_')
            month_num = int(parts[-1])
            daily_metrics, num_days = collect_daily_dg_metrics(month_xls, cfg)
            if daily_metrics:
                monthly_dg_metrics[month_num] = daily_metrics
        except (PermissionError, ValueError, IndexError):
            continue

    return daily_df, oil_df, blackout_df, hfo_detail, monthly_dg_metrics


def build_site_data(site_key):
    """Build the siteData object for a given site from xlsx files."""
    cfg = SITE_CONFIG[site_key]
    result = load_site_files(cfg)
    if result is None:
        return None

    daily_df, oil_df, blackout_df, hfo_detail, monthly_dg_metrics = result
    dd = cfg["dd_cols"]
    num_eng = cfg["num_engines"]

    if daily_df.empty:
        return None

    # Filter out rows with zero production (future/empty dates)
    daily_df = daily_df[daily_df.iloc[:, dd["gross_mwh"]].apply(safe_float) > 0]
    oil_conso_col = cfg.get("oil_conso_total_col")
    if not oil_df.empty and oil_conso_col is not None:
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

        # Get oil data (skip if engine has no oil columns or no oil sheet)
        oil_conso = 0.0
        oil_rh = 0.0
        if latest_oil is not None and eng.get("col_conso") is not None:
            oil_conso = safe_float(latest_oil.iloc[eng["col_conso"]])
            if cfg.get("oil_rh_is_time"):
                oil_rh = time_to_hours(latest_oil.iloc[eng["col_rh"]])
            else:
                oil_rh = safe_float(latest_oil.iloc[eng["col_rh"]])

        # ── Merge HFO daily report detail (richer data) ──
        hd = hfo_detail.get(dg_id, {})

        # Determine status
        if cfg["has_dg_status"]:
            raw_status = status_map_raw.get(dg_id, "Unknown")
            statut = dg_status_to_code(raw_status)
            condition = dg_condition(raw_status)
        else:
            # No DG status in sheet — infer from oil hours or HFO detail
            if oil_rh > 0:
                statut = "ok"
                condition = "Running"
            elif hd.get("hToday", 0) > 0:
                statut = "ok"
                condition = "Running"
            else:
                statut = "standby"
                condition = "Standby"

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
            "hourlyLoad": hd.get("hourlyLoad", [0] * 24),
            "dailyProd": [],         # filled below
            "dailyHours": [],        # filled below
            "dailyHFO": [],          # filled below
            "dailyLFO": [],          # filled below
            "dailyOilConso": [],     # filled below
            "dailyOilTopUp": [],     # filled below
            "dailyMaxLoad": [],      # filled below
            "dailyConsLVMV": [],     # filled below
            "dailyStandby": [],      # filled below
            "dailyArretForce": [],   # filled below
            "dailyArretPlanifie": [],# filled below
            "monthlyProd": [],       # filled below
            "monthlyHours": [],      # filled below
            "monthlyHFO": [],        # filled below
            "monthlyLFO": [],        # filled below
            "monthlyOilConso": [],   # filled below
            "monthlyOilTopUp": [],   # filled below
            "monthlyMaxLoad": [],    # filled below
            "monthlyConsLVMV": [],   # filled below
        }
        groupes.append(groupe)

    # --- Fill daily & monthly arrays for ALL metrics per DG ---
    # Determine which month is the latest (from the latest daily data date)
    current_month = latest_date.month if pd.notna(latest_date) else None

    # Mapping: groupe field name → metric key in daily_dg_metrics
    _DAILY_MAP = {
        "dailyProd":          "energieProd",
        "dailyHours":         "hToday",
        "dailyHFO":           "consoHFO",
        "dailyLFO":           "consoLFO",
        "dailyOilConso":      "oilConso",
        "dailyOilTopUp":      "oilTopUp",
        "dailyMaxLoad":       "maxLoad",
        "dailyConsLVMV":      "consLVMV",
        "dailyStandby":       "hStandby",
        "dailyArretForce":    "arretForce",
        "dailyArretPlanifie": "arretPlanifie",
    }
    _MONTHLY_MAP = {
        "monthlyProd":          "energieProd",
        "monthlyHours":         "hToday",
        "monthlyHFO":           "consoHFO",
        "monthlyLFO":           "consoLFO",
        "monthlyOilConso":      "oilConso",
        "monthlyOilTopUp":      "oilTopUp",
        "monthlyMaxLoad":       "maxLoad",
        "monthlyConsLVMV":      "consLVMV",
        "monthlyStandby":       "hStandby",
        "monthlyArretForce":    "arretForce",
        "monthlyArretPlanifie": "arretPlanifie",
    }
    # Metrics that should use max() instead of sum() for monthly aggregation
    _MAX_METRICS = {"maxLoad"}

    for g in groupes:
        dg_id = g["id"]

        # Daily arrays for current month
        if current_month and current_month in monthly_dg_metrics:
            dm = monthly_dg_metrics[current_month].get(dg_id, {})
            for field, metric_key in _DAILY_MAP.items():
                g[field] = dm.get(metric_key, [0.0] * 31)

        # Monthly totals for the year (sum or max of daily values per month)
        for field, metric_key in _MONTHLY_MAP.items():
            month_totals = []
            for m in range(1, 13):
                if m in monthly_dg_metrics and dg_id in monthly_dg_metrics[m]:
                    daily_vals = monthly_dg_metrics[m][dg_id].get(metric_key, [0.0] * 31)
                    if metric_key in _MAX_METRICS:
                        month_totals.append(round(max(daily_vals), 1))
                    else:
                        month_totals.append(round(sum(daily_vals), 1))
                else:
                    month_totals.append(0.0)
            g[field] = month_totals

    # --- Compute KPIs ---
    hfo_is_liters = cfg.get("hfo_is_liters", False)
    energy_in_mwh = cfg.get("dd_energy_in_mwh", False)
    dd_hours_as_time = cfg.get("dd_hours_as_time", False)

    def compute_kpi(df_slice, num_days):
        net_raw = df_slice.iloc[:, dd["net_mwh"]].apply(safe_float).sum()
        hfo = df_slice.iloc[:, dd["hfo_kgs"]].apply(safe_float).sum()
        lube = df_slice.iloc[:, dd["lube_oil"]].apply(safe_float).sum()
        # Tulear hours columns are timedelta — need time_to_hours conversion
        if dd_hours_as_time:
            run = df_slice.iloc[:, dd["run"]].apply(time_to_hours).sum()
        else:
            run = df_slice.iloc[:, dd["run"]].apply(safe_float).sum()
        # Majunga Brief data has energy in MWh; Tamatave/Diego in kWh
        if energy_in_mwh:
            prod = net_raw          # already MWh
            net_kwh = net_raw * 1000  # convert to kWh for SFOC/SLOC
        else:
            prod = net_raw / 1000   # kWh → MWh
            net_kwh = net_raw
        # If HFO column is liters (Majunga), convert to kgs first
        hfo_kgs = hfo * HFO_DENSITY if hfo_is_liters else hfo
        sfoc = round(hfo_kgs * 1000 / net_kwh, 1) if net_kwh > 0 else None
        sloc = round(lube / net_kwh * 1000, 2) if net_kwh > 0 else None
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

    # Per-month KPIs (month_1 through month_12)
    per_month_kpis = {}
    for m in range(1, 13):
        m_mask = daily_df.iloc[:, dd["date"]].apply(
            lambda x, month=m: isinstance(x, (datetime, pd.Timestamp)) and
            pd.Timestamp(x).month == month and pd.Timestamp(x).year == now.year
        )
        m_df = daily_df[m_mask]
        if len(m_df) > 0:
            p, r, sf, sl, d = compute_kpi(m_df, len(m_df))
            per_month_kpis[f"month_{m}"] = {
                "prod": round(p, 1), "prodObj": cfg["prod_obj_month"],
                "dispo": d, "heures": round(r, 1),
                "sfoc": sf, "sloc": sl,
            }
        else:
            per_month_kpis[f"month_{m}"] = {
                "prod": 0, "prodObj": cfg["prod_obj_month"],
                "dispo": 0, "heures": 0,
                "sfoc": None, "sloc": None,
            }

    # Total running MW (use per-engine MW for sites with different DG capacities)
    running_count = sum(1 for g in groupes if g["statut"] == "ok")
    mw_total = round(sum(g["mw"] for g in groupes if g["statut"] == "ok"), 1)

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
                "description": str(row.iloc[bo_cols["description"]]) if bo_cols.get("description") is not None and pd.notna(row.iloc[bo_cols["description"]]) else "",
                "cause": str(row.iloc[bo_cols["cause"]]) if bo_cols.get("cause") is not None and pd.notna(row.iloc[bo_cols["cause"]]) else "",
                "source": str(row.iloc[bo_cols["source"]]) if bo_cols.get("source") is not None and pd.notna(row.iloc[bo_cols["source"]]) else "",
                "start": str(row.iloc[bo_cols["start"]]) if bo_cols.get("start") is not None and pd.notna(row.iloc[bo_cols["start"]]) else "",
                "end": str(row.iloc[bo_cols["end"]]) if bo_cols.get("end") is not None and pd.notna(row.iloc[bo_cols["end"]]) else "",
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
            # Convert hours columns appropriately
            if dd_hours_as_time:
                run_val = round(time_to_hours(row.iloc[dd["run"]]), 1)
                standby_val = round(time_to_hours(row.iloc[dd["standby"]]), 1)
            else:
                run_val = round(safe_float(row.iloc[dd["run"]]), 1)
                standby_val = round(safe_float(row.iloc[dd["standby"]]), 1)
            # Convert energy to MWh for trend display
            if energy_in_mwh:
                gross = round(safe_float(row.iloc[dd["gross_mwh"]]), 1)
                net = round(safe_float(row.iloc[dd["net_mwh"]]), 1)
            else:
                gross = round(safe_float(row.iloc[dd["gross_mwh"]]) / 1000, 1)
                net = round(safe_float(row.iloc[dd["net_mwh"]]) / 1000, 1)
            daily_trend.append({
                "date": str(d.date()),
                "gross_mwh": gross,
                "net_mwh": net,
                "hfo_kgs": round(safe_float(row.iloc[dd["hfo_kgs"]])),
                "lube_oil": round(safe_float(row.iloc[dd["lube_oil"]]), 1),
                "run_hours": run_val,
                "standby": standby_val,
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
        "latestMonth": latest_date.month if pd.notna(latest_date) else 1,
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
            **per_month_kpis,
        },
        "prev2025": cfg["prev2025"],
        "blackouts": blackout_events,
        "dailyTrend": daily_trend,
    }


# Backward compatibility
def build_tamatave_data():
    return build_site_data("tamatave")


if __name__ == "__main__":
    import json
    for site in ["tamatave", "diego", "majunga", "tulear"]:
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
