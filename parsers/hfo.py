"""
parsers/hfo.py — HFO site production parser.
Uses SharePoint to download monthly Excel files, then reuses the parsing
functions from data_loader.py (which already handles the complex column/sheet
layouts for Tamatave, Diego, Majunga, Tulear).
"""
import io
import logging
import re
from datetime import datetime

import sharepoint_client as sp

log = logging.getLogger(__name__)

# SharePoint folder paths and file prefixes for each HFO site
_SP_SITES = {
    "tamatave": {
        "folder": "01_Energy/Production/HFO/Tamatave",
        "prefix": "Tamatave",
        "solar_folder": "01_Energy/Production/HFO/Tamatave",
        "solar_prefix": "Tamatave_Solar",
    },
    "diego": {
        "folder": "01_Energy/Production/HFO/Diego",
        "prefix": "Diego",
    },
    "majunga": {
        "folder": "01_Energy/Production/HFO/Majunga",
        "prefix": "Majunga",
    },
    "tulear": {
        "folder": "01_Energy/Production/HFO/Tulera",
        "prefix": "Tulear",
    },
}

_CURRENT_YEAR = datetime.now().year


def _find_monthly_files(folder: str, prefix: str, year: int) -> list[str]:
    """Return list of relative paths for all monthly files, sorted by month."""
    pattern = re.compile(
        rf"^{re.escape(prefix)}_{year}_(\d{{2}})\.xlsx$",
        re.IGNORECASE,
    )
    try:
        items = sp.list_folder(folder)
    except Exception as exc:
        log.warning("HFO: cannot list folder %s: %s", folder, exc)
        return []

    found = []
    for item in items:
        name = item.get("name", "")
        m = pattern.match(name)
        if m:
            found.append((int(m.group(1)), f"{folder}/{name}"))

    found.sort(key=lambda x: x[0])
    return [path for _, path in found]


def _get_paths_for_site(sp_cfg: dict, year: int, month: int | None) -> list[str]:
    """
    Return the file paths to load for a site.

    If month is given, return the single file for that month (or [] if not found).
    If month is None, return all available monthly files for the year.
    """
    if month is not None:
        path = sp.find_monthly_file(sp_cfg["folder"], sp_cfg["prefix"], year, month)
        return [path] if path else []
    return _find_monthly_files(sp_cfg["folder"], sp_cfg["prefix"], year)


def list_available_months() -> dict:
    """
    Return available months per HFO site for the current year.

    Returns:
        {"year": YYYY, "hfo": {"tamatave": [1,2,3], "diego": [1,2], ...}}
    """
    year = _CURRENT_YEAR
    result = {}
    for site_key, sp_cfg in _SP_SITES.items():
        months = sp.list_available_months(sp_cfg["folder"], sp_cfg["prefix"], year)
        if not months:
            months = sp.list_available_months(sp_cfg["folder"], sp_cfg["prefix"], year - 1)
        result[site_key] = months
    log.debug("HFO available months: %s", result)
    return {"year": year, "hfo": result}


def build_site(site_key: str, month: int | None = None) -> dict | None:
    """Build site data for one HFO site by downloading from SharePoint."""
    try:
        import pandas as pd
        import data_loader as dl
    except ImportError as exc:
        log.error("HFO: cannot import dependencies: %s", exc)
        raise

    sp_cfg = _SP_SITES.get(site_key)
    cfg = dl.SITE_CONFIG.get(site_key)
    if not sp_cfg or not cfg:
        log.error("HFO: unknown site key: %s", site_key)
        return None

    year = _CURRENT_YEAR
    monthly_paths = _get_paths_for_site(sp_cfg, year, month)
    if not monthly_paths and month is None:
        # Try previous year as fallback (only for "latest" requests, not specific months)
        year = _CURRENT_YEAR - 1
        monthly_paths = _get_paths_for_site(sp_cfg, year, month)

    if not monthly_paths:
        log.warning("HFO: no files found for site %s year %d month %s", site_key, _CURRENT_YEAR, month)
        return None

    dd = cfg["dd_cols"]
    dd_sheet = cfg.get("daily_data_sheet", "Daily Data")
    dd_start = cfg.get("dd_data_start_row", 4)
    oil_sheet_name = cfg.get("oil_sheet", "Specific data oil")
    bo_start = cfg["blackout_data_start_row"]
    bo_date_col = cfg["blackout_date_col"]

    all_daily = []
    all_oil = []
    all_blackout = []
    monthly_dg_metrics = {}

    for path in monthly_paths:
        # Extract month from filename
        m = re.search(r'_(\d{2})\.xlsx$', path, re.IGNORECASE)
        file_month = int(m.group(1)) if m else None

        try:
            file_bytes = sp.get_file_bytes(path)
            xls = pd.ExcelFile(io.BytesIO(file_bytes))
        except Exception as exc:
            log.warning("HFO %s: failed to download %s: %s", site_key, path, exc)
            continue

        # Daily data
        try:
            sheet = dd_sheet if dd_sheet in xls.sheet_names else (
                next((s for s in xls.sheet_names if s.lower().strip() == dd_sheet.lower().strip()), None)
            )
            if sheet:
                daily_df_raw = pd.read_excel(xls, sheet_name=sheet, header=None)
                daily_data = daily_df_raw.iloc[dd_start:].copy()
                daily_data = daily_data[daily_data.iloc[:, 0].apply(
                    lambda x: isinstance(x, (datetime, pd.Timestamp))
                )]
                if file_month:
                    daily_data["_file_month"] = file_month
                all_daily.append(daily_data)
        except Exception as exc:
            log.warning("HFO %s: daily data parse error for %s: %s", site_key, path, exc)

        # Oil sheet
        if oil_sheet_name:
            try:
                oil_sheet = next((s for s in xls.sheet_names if s.lower().strip() == oil_sheet_name.lower().strip()), None)
                if oil_sheet:
                    oil_df_raw = pd.read_excel(xls, sheet_name=oil_sheet, header=None)
                    oil_start = cfg.get("oil_data_start_row", 13)
                    oil_data = oil_df_raw.iloc[oil_start:].copy()

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
            except Exception as exc:
                log.debug("HFO %s: oil sheet error for %s: %s", site_key, path, exc)

        # Blackout sheet
        try:
            bo_sheet_name = cfg.get("blackout_sheet", "Blackout")
            bo_actual = next((s for s in xls.sheet_names if s.lower().strip() == bo_sheet_name.lower().strip()), None)
            if bo_actual:
                bo_df_raw = pd.read_excel(xls, sheet_name=bo_actual, header=None)
                bo_data = bo_df_raw.iloc[bo_start:].copy()
                bo_data = bo_data[bo_data.iloc[:, bo_date_col].apply(
                    lambda x: isinstance(x, (datetime, pd.Timestamp))
                )]
                all_blackout.append(bo_data)
        except Exception as exc:
            log.debug("HFO %s: blackout error for %s: %s", site_key, path, exc)

        # Per-DG daily metrics
        if file_month:
            try:
                daily_metrics, num_days = dl.collect_daily_dg_metrics(xls, cfg)
                if daily_metrics:
                    monthly_dg_metrics[file_month] = daily_metrics
            except Exception as exc:
                log.debug("HFO %s: DG metrics error for month %s: %s", site_key, file_month, exc)

    if not all_daily:
        log.warning("HFO %s: no daily data found", site_key)
        return None

    daily_df = pd.concat(all_daily, ignore_index=True) if all_daily else pd.DataFrame()
    oil_df = pd.concat(all_oil, ignore_index=True) if all_oil else pd.DataFrame()
    blackout_df = pd.concat(all_blackout, ignore_index=True) if all_blackout else pd.DataFrame()

    # HFO detail from latest file
    hfo_detail = {}
    if monthly_paths:
        for path in reversed(monthly_paths):
            try:
                file_bytes = sp.get_file_bytes(path)
                latest_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                hfo_detail = dl.parse_hfo_detail(latest_xls, cfg)
                break
            except Exception:
                continue

    # Fuel stock from latest file
    fuel_stock_data = None
    if cfg.get("fuel_stock_sheet") and monthly_paths:
        for path in reversed(monthly_paths):
            try:
                file_bytes = sp.get_file_bytes(path)
                latest_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                fuel_stock_data = dl.parse_fuel_stock(latest_xls, cfg)
                break
            except Exception:
                continue

    # Solar production
    solar_data = None
    solar_prefix = sp_cfg.get("solar_prefix")
    solar_folder = sp_cfg.get("solar_folder", sp_cfg["folder"])
    if solar_prefix:
        solar_paths = _find_monthly_files(solar_folder, solar_prefix, _CURRENT_YEAR)
        if solar_paths:
            try:
                file_bytes = sp.get_file_bytes(solar_paths[-1])
                solar_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                solar_data = dl.parse_solar(solar_xls, cfg)
            except Exception as exc:
                log.debug("HFO %s: solar error: %s", site_key, exc)

    # In-file solar sheet (Tulear)
    if not solar_data and cfg.get("solar_sheet") and monthly_paths:
        for path in reversed(monthly_paths):
            try:
                file_bytes = sp.get_file_bytes(path)
                latest_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                solar_data = dl.parse_solar(latest_xls, cfg)
                if solar_data:
                    break
            except Exception:
                continue

    # Oil stock from latest file
    oil_stock_data = None
    if monthly_paths:
        for path in reversed(monthly_paths):
            try:
                file_bytes = sp.get_file_bytes(path)
                latest_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                oil_stock_data = dl.parse_oil_stock(latest_xls, cfg)
                break
            except Exception:
                continue

    # Load chart (Majunga)
    load_chart_data = None
    if cfg.get("load_chart_sheet") and monthly_paths:
        for path in reversed(monthly_paths):
            try:
                file_bytes = sp.get_file_bytes(path)
                latest_xls = pd.ExcelFile(io.BytesIO(file_bytes))
                load_chart_data = dl.parse_load_chart(latest_xls, cfg)
                break
            except Exception:
                continue

    return dl.build_site_from_frames(
        site_key=site_key,
        daily_df=daily_df,
        oil_df=oil_df,
        blackout_df=blackout_df,
        hfo_detail=hfo_detail,
        monthly_dg_metrics=monthly_dg_metrics,
        fuel_stock_data=fuel_stock_data,
        solar_data=solar_data,
        oil_stock_data=oil_stock_data,
        load_chart_data=load_chart_data,
    )


def build_all_sites(month: int | None = None) -> dict:
    """
    Build all 4 HFO sites and return dict matching window.siteData globals.

    Args:
        month: If provided, load only that month's file per site.
               If None, load all available months for the current year.
    """
    js_var_map = {
        "tamatave": "TAMATAVE_LIVE",
        "diego": "DIEGO_LIVE",
        "majunga": "MAJUNGA_LIVE",
        "tulear": "TULEAR_LIVE",
    }
    result = {}
    for site_key, js_var in js_var_map.items():
        try:
            data = build_site(site_key, month=month)
            if data:
                result[js_var] = data
                log.info("HFO %s (month=%s): status=%s, mw=%s", site_key, month, data.get("status"), data.get("mw"))
            else:
                log.warning("HFO %s (month=%s): no data", site_key, month)
        except Exception as exc:
            log.error("HFO %s: build failed: %s", site_key, exc)
    return result
