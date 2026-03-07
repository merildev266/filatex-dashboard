"""
Loads Tamatave xlsx daily reports and transforms them into the siteData format
expected by the Filatex PMO Dashboard frontend.
"""
import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "1. DATA Meril HIVANAKO",
    "Bureau",
    "Daily Tamatave",
)

# Engine mapping from xlsx columns to dashboard IDs
# Specific data oil sheet: engines start at col 8, pairs (Conso, Daily R/h)
ENGINE_MAP = [
    {"id": "DG1",  "col_conso": 8,  "col_rh": 9,  "model": "9L20"},
    {"id": "DG2",  "col_conso": 10, "col_rh": 11, "model": "9L20"},
    {"id": "DG3",  "col_conso": 12, "col_rh": 13, "model": "9L20"},
    {"id": "DG4",  "col_conso": 14, "col_rh": 15, "model": "9L20"},
    {"id": "DG5",  "col_conso": 16, "col_rh": 17, "model": "9L20"},
    {"id": "DG6",  "col_conso": 18, "col_rh": 19, "model": "9L20"},
    {"id": "DG7",  "col_conso": 20, "col_rh": 21, "model": "18V32LN"},
    {"id": "DG8",  "col_conso": 22, "col_rh": 23, "model": "18V32STD"},
    {"id": "DG9",  "col_conso": 24, "col_rh": 25, "model": "12V32LN"},
    {"id": "DG10", "col_conso": 26, "col_rh": 27, "model": "12V32LN"},
    {"id": "DG11", "col_conso": 28, "col_rh": 29, "model": "12V32LN"},
    {"id": "DG12", "col_conso": 30, "col_rh": 31, "model": "12V32LN"},
    {"id": "DG13", "col_conso": 32, "col_rh": 33, "model": "12V32LN"},
]

# Daily Data sheet column indices
DD_COLS = {
    "date": 0,
    "gross_mwh": 1,
    "net_mwh": 2,
    "station_use": 3,
    "planned_maint": 4,
    "forced": 5,
    "standby": 6,
    "run": 7,
    "hfo_kgs": 8,
    "lfo": 9,
    "lube_oil": 10,
    "sfoc_ltr": 11,
    "sfoc_gm": 12,
    "max_load_1": 13,
    "max_load_2": 14,
}

# DG status columns in Daily Data: DG#01=col15 ... DG#13=col27
DG_STATUS_START = 15


def safe_float(v, default=0.0):
    try:
        f = float(v)
        return 0.0 if np.isnan(f) else f
    except (ValueError, TypeError):
        return default


def load_all_files():
    """Load all Tamatave xlsx files and return combined data."""
    pattern = os.path.join(DATA_DIR, "Tamatave_2026_*.xlsx")
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
        # Data rows start at row 4, skip header rows 0-3
        dd_data = dd.iloc[4:].copy()
        dd_data = dd_data[dd_data.iloc[:, 0].apply(lambda x: isinstance(x, (datetime, pd.Timestamp)))]
        all_daily.append(dd_data)

        # --- Specific data oil ---
        oil = pd.read_excel(xls, sheet_name="Specific data oil", header=None)
        # Data rows start at row 13
        oil_data = oil.iloc[13:].copy()
        oil_data = oil_data[oil_data.iloc[:, 0].apply(lambda x: isinstance(x, (datetime, pd.Timestamp)))]
        all_oil.append(oil_data)

        # --- Blackout ---
        bo = pd.read_excel(xls, sheet_name="Blackout", header=None)
        # Data rows start at row 2
        bo_data = bo.iloc[2:].copy()
        bo_data = bo_data[bo_data.iloc[:, 1].apply(lambda x: isinstance(x, (datetime, pd.Timestamp)))]
        all_blackout.append(bo_data)

    daily_df = pd.concat(all_daily, ignore_index=True) if all_daily else pd.DataFrame()
    oil_df = pd.concat(all_oil, ignore_index=True) if all_oil else pd.DataFrame()
    blackout_df = pd.concat(all_blackout, ignore_index=True) if all_blackout else pd.DataFrame()

    return daily_df, oil_df, blackout_df


def build_tamatave_data():
    """Build the siteData.tamatave object from xlsx files."""
    result = load_all_files()
    if result is None:
        return None

    daily_df, oil_df, blackout_df = result

    if daily_df.empty:
        return None

    # Filter out rows with zero production (future/empty dates)
    daily_df = daily_df[daily_df.iloc[:, DD_COLS["gross_mwh"]].apply(safe_float) > 0]
    if not oil_df.empty:
        oil_df = oil_df[oil_df.iloc[:, 7].apply(safe_float) > 0]  # col7 = Conso Total Formule

    if daily_df.empty:
        return None

    # --- Latest day data (last row with actual data) ---
    latest = daily_df.iloc[-1]
    latest_date = pd.Timestamp(latest.iloc[DD_COLS["date"]])

    # --- Build per-engine data from latest oil row ---
    latest_oil = oil_df.iloc[-1] if not oil_df.empty else None

    # DG statuses from latest daily data row
    status_map_raw = {}
    for i in range(13):
        col_idx = DG_STATUS_START + i
        if col_idx < len(latest):
            status_map_raw[f"DG{i+1}"] = str(latest.iloc[col_idx]) if pd.notna(latest.iloc[col_idx]) else "Unknown"

    def dg_status_to_code(s):
        s = str(s).lower().strip()
        if s == "running":
            return "ok"
        elif s in ("stop", "stopped", "standby", "st/by", "standyby"):
            return "standby"
        elif s in ("maintenance",):
            return "warn"
        elif s in ("breakdown", "br/do"):
            return "ko"
        else:
            return "ko"

    def dg_condition(s):
        s = str(s).strip()
        sl = s.lower()
        if sl == "running":
            return "Running"
        elif sl == "maintenance":
            return "Maintenance"
        elif sl in ("breakdown", "br/do"):
            return "Breakdown"
        elif sl in ("standby", "st/by", "standyby"):
            return "Standby"
        elif sl in ("stop", "stopped"):
            return "Stopped"
        return s

    groupes = []
    for eng in ENGINE_MAP:
        dg_id = eng["id"]
        raw_status = status_map_raw.get(dg_id, "Unknown")
        statut = dg_status_to_code(raw_status)
        condition = dg_condition(raw_status)

        oil_conso = 0.0
        oil_rh = 0.0
        if latest_oil is not None:
            oil_conso = safe_float(latest_oil.iloc[eng["col_conso"]])
            oil_rh = safe_float(latest_oil.iloc[eng["col_rh"]])

        # Calculate SFOC per engine (not directly available per-engine in daily, use site average)
        energie_prod = 0.0
        conso_hfo = 0.0

        # Running hours today
        h_today = oil_rh

        groupe = {
            "id": dg_id,
            "model": eng["model"],
            "mw": 1.85,
            "statut": statut,
            "condition": condition,
            "jourArret": 0 if statut == "ok" else 1,
            "h": 0,
            "hToday": round(h_today, 1),
            "hStandby": 0,
            "arretForce": 24 if condition == "Breakdown" else 0,
            "arretPlanifie": 24 if condition == "Maintenance" else 0,
            "maxLoad": 0,
            "energieProd": round(energie_prod, 1),
            "consLVMV": 0,
            "consoHFO": round(conso_hfo, 1),
            "consoLFO": 0,
            "oilTopUp": round(oil_conso, 1),
            "oilConso": round(oil_conso, 1),
            "oilSumpLevel": 0,
            "lubeOilPressure": 0,
            "fuelOilTemp": 0,
            "sfoc": None,
            "sloc": None,
            "maint": f"{condition}" if condition != "Running" else "Running normal",
            "hourlyLoad": [0] * 24,
        }
        groupes.append(groupe)

    # --- Compute KPIs ---
    # Last 24h = last row
    prod_24h = safe_float(latest.iloc[DD_COLS["net_mwh"]]) / 1000  # kWh -> MWh
    hfo_24h = safe_float(latest.iloc[DD_COLS["hfo_kgs"]])
    lube_24h = safe_float(latest.iloc[DD_COLS["lube_oil"]])
    run_24h = safe_float(latest.iloc[DD_COLS["run"]])

    # SFOC = HFO (g) / Net Energy (kWh)
    net_kwh_24h = safe_float(latest.iloc[DD_COLS["net_mwh"]])
    sfoc_24h = round(hfo_24h * 1000 / net_kwh_24h, 1) if net_kwh_24h > 0 else None
    sloc_24h = round(lube_24h / net_kwh_24h * 1000, 2) if net_kwh_24h > 0 else None

    # Availability = run hours / (13 engines * 24h) * 100
    total_possible_hours = 13 * 24
    dispo_24h = round(run_24h / total_possible_hours * 100, 1) if total_possible_hours > 0 else 0

    # Current month data
    now = latest_date
    month_mask = daily_df.iloc[:, DD_COLS["date"]].apply(
        lambda x: isinstance(x, (datetime, pd.Timestamp)) and pd.Timestamp(x).month == now.month and pd.Timestamp(x).year == now.year
    )
    month_df = daily_df[month_mask]

    prod_month = month_df.iloc[:, DD_COLS["net_mwh"]].apply(safe_float).sum() / 1000
    hfo_month = month_df.iloc[:, DD_COLS["hfo_kgs"]].apply(safe_float).sum()
    lube_month = month_df.iloc[:, DD_COLS["lube_oil"]].apply(safe_float).sum()
    run_month = month_df.iloc[:, DD_COLS["run"]].apply(safe_float).sum()
    net_kwh_month = month_df.iloc[:, DD_COLS["net_mwh"]].apply(safe_float).sum()

    sfoc_month = round(hfo_month * 1000 / net_kwh_month, 1) if net_kwh_month > 0 else None
    sloc_month = round(lube_month / net_kwh_month * 1000, 2) if net_kwh_month > 0 else None
    days_month = len(month_df)
    dispo_month = round(run_month / (13 * 24 * days_month) * 100, 1) if days_month > 0 else 0

    # Year data
    year_mask = daily_df.iloc[:, DD_COLS["date"]].apply(
        lambda x: isinstance(x, (datetime, pd.Timestamp)) and pd.Timestamp(x).year == now.year
    )
    year_df = daily_df[year_mask]

    prod_year = year_df.iloc[:, DD_COLS["net_mwh"]].apply(safe_float).sum() / 1000
    hfo_year = year_df.iloc[:, DD_COLS["hfo_kgs"]].apply(safe_float).sum()
    lube_year = year_df.iloc[:, DD_COLS["lube_oil"]].apply(safe_float).sum()
    run_year = year_df.iloc[:, DD_COLS["run"]].apply(safe_float).sum()
    net_kwh_year = year_df.iloc[:, DD_COLS["net_mwh"]].apply(safe_float).sum()

    sfoc_year = round(hfo_year * 1000 / net_kwh_year, 1) if net_kwh_year > 0 else None
    sloc_year = round(lube_year / net_kwh_year * 1000, 2) if net_kwh_year > 0 else None
    days_year = len(year_df)
    dispo_year = round(run_year / (13 * 24 * days_year) * 100, 1) if days_year > 0 else 0

    # Total running MW
    running_count = sum(1 for g in groupes if g["statut"] == "ok")
    mw_total = round(running_count * 1.85, 1)

    # Overall site status
    if running_count == 0:
        site_status = "ko"
    elif running_count < 8:
        site_status = "warn"
    else:
        site_status = "ok"

    # --- Blackout data ---
    blackout_events = []
    for _, row in blackout_df.iterrows():
        try:
            blackout_events.append({
                "date": str(pd.Timestamp(row.iloc[1]).date()),
                "description": str(row.iloc[2]) if pd.notna(row.iloc[2]) else "",
                "cause": str(row.iloc[3]) if pd.notna(row.iloc[3]) else "",
                "source": str(row.iloc[4]) if pd.notna(row.iloc[4]) else "",
                "start": str(row.iloc[6]) if pd.notna(row.iloc[6]) else "",
                "end": str(row.iloc[7]) if pd.notna(row.iloc[7]) else "",
                "duration": str(row.iloc[8]) if pd.notna(row.iloc[8]) else "",
                "incharge": str(row.iloc[9]) if pd.notna(row.iloc[9]) else "",
            })
        except Exception:
            continue

    # --- Daily trend data for charts ---
    daily_trend = []
    for _, row in daily_df.iterrows():
        try:
            d = pd.Timestamp(row.iloc[DD_COLS["date"]])
            daily_trend.append({
                "date": str(d.date()),
                "gross_mwh": round(safe_float(row.iloc[DD_COLS["gross_mwh"]]) / 1000, 1),
                "net_mwh": round(safe_float(row.iloc[DD_COLS["net_mwh"]]) / 1000, 1),
                "hfo_kgs": round(safe_float(row.iloc[DD_COLS["hfo_kgs"]])),
                "lube_oil": round(safe_float(row.iloc[DD_COLS["lube_oil"]]), 1),
                "run_hours": round(safe_float(row.iloc[DD_COLS["run"]]), 1),
                "standby": round(safe_float(row.iloc[DD_COLS["standby"]]), 1),
                "max_load": round(safe_float(row.iloc[DD_COLS["max_load_1"]])),
            })
        except Exception:
            continue

    return {
        "name": "Tamatave",
        "status": site_status,
        "mw": mw_total,
        "contrat": 24,
        "latestDate": str(latest_date.date()),
        "groupes": groupes,
        "kpi": {
            "24h": {
                "prod": round(prod_24h, 1),
                "prodObj": 19.2,
                "dispo": dispo_24h,
                "heures": round(run_24h, 1),
                "sfoc": sfoc_24h,
                "sloc": sloc_24h,
            },
            "month": {
                "prod": round(prod_month, 1),
                "prodObj": 430,
                "dispo": dispo_month,
                "heures": round(run_month, 1),
                "sfoc": sfoc_month,
                "sloc": sloc_month,
            },
            "year": {
                "prod": round(prod_year, 1),
                "prodObj": 5160,
                "dispo": dispo_year,
                "heures": round(run_year, 1),
                "sfoc": sfoc_year,
                "sloc": sloc_year,
            },
        },
        "prev2025": {
            "24h": {"prod": 16.8, "dispo": 95.1, "sfoc": 202, "sloc": 0.84},
            "month": {"prod": 398, "dispo": 94.5, "sfoc": 203, "sloc": 0.85},
            "year": {"prod": 4620, "dispo": 94.1, "sfoc": 205, "sloc": 0.86},
        },
        "blackouts": blackout_events,
        "dailyTrend": daily_trend,
    }


if __name__ == "__main__":
    import json
    data = build_tamatave_data()
    if data:
        print(json.dumps(data, indent=2, default=str))
    else:
        print("No data found")
