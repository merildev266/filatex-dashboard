# Filatex Dashboard — SharePoint Migration Plan

**Date:** 2026-03-22 | **Status:** Implementation-ready reference

---

## Data Safety Principle

> **Excel files are the immutable source of truth. The system NEVER modifies them — except writing to the two pre-established comment columns (P/Q in ENR weekly, J/K in Investments weekly). All reads are non-destructive. No generate_*.py script ever touches a source file.**

---

## Target Architecture

```
SharePoint/OneDrive (Excel files)
        │
        ▼ Graph API (HTTPS)
┌─────────────────────────────────┐
│  sharepoint_client.py           │  MSAL auth + file download
│  cache.py                       │  In-memory TTL + background refresh
├─────────────────────────────────┤
│  parsers/                       │  Pure Excel → dict transformations
│    hfo.py  enr.py  projects.py  │  (no side effects, no file writes)
│    capex.py  reporting.py       │
├─────────────────────────────────┤
│  api_data.py  (Flask Blueprint) │  REST endpoints /api/*
└─────────────────────────────────┘
        │ JSON
        ▼ fetch()
┌─────────────────────────────────┐
│  js/data_loader.js              │  Single fetch layer, assigns globals
│  energy.js, reporting.js …     │  Unchanged — reads same window.* vars
└─────────────────────────────────┘
```

**Eliminated:** `generate_data.py`, `generate_enr_data.py`, `generate_hfo_projects.py`, `generate_enr_projects.py`, `generate_capex.py`, `generate_reporting.py`, and all `*_data.js` static files.

---

## Phase 1 — SharePoint Client + Cache

### 1.1 Azure App Registration

| Setting | Value |
|---------|-------|
| App name | `filatex-dashboard-api` |
| Tenant type | Single tenant |
| Auth flow | Client Credentials (no user login required) |
| Permissions | `Files.Read.All`, `Files.ReadWrite.All`, `Sites.Read.All` — **Application** type |
| Secret expiry | 24 months, store in `.env` |

Admin consent required for Application permissions. Test read access before proceeding to Phase 2.

```bash
# Discover IDs after registering the app
GET https://graph.microsoft.com/v1.0/sites?search=filatex       # → site.id
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives     # → drive.id
```

### 1.2 `.env` file (never commit)

```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ONEDRIVE_DRIVE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DATA_BASE_PATH=Fichiers de DOSSIER DASHBOARD - Data_Dashbords

# TTL in seconds (override per environment)
TTL_HFO_SITES=3600
TTL_ENR_SITES=3600
TTL_HFO_PROJECTS=1800
TTL_ENR_PROJECTS=900
TTL_CAPEX=3600
TTL_REPORTING=900
TTL_INVESTMENTS=900
```

Add `.env` to `.gitignore`.

### 1.3 `sharepoint_client.py`

```python
import os, io, logging, requests
from msal import ConfidentialClientApplication
from openpyxl import load_workbook
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)
GRAPH = "https://graph.microsoft.com/v1.0"
_msal = None

def _app():
    global _msal
    if not _msal:
        _msal = ConfidentialClientApplication(
            client_id=os.environ["AZURE_CLIENT_ID"],
            client_credential=os.environ["AZURE_CLIENT_SECRET"],
            authority=f"https://login.microsoftonline.com/{os.environ['AZURE_TENANT_ID']}"
        )
    return _msal

def _token():
    r = _app().acquire_token_silent(["https://graph.microsoft.com/.default"], account=None)
    if not r:
        r = _app().acquire_token_for_client(["https://graph.microsoft.com/.default"])
    if "access_token" not in r:
        raise RuntimeError(f"Auth failed: {r.get('error_description')}")
    return r["access_token"]

def _headers():
    return {"Authorization": f"Bearer {_token()}"}

def _drive_url(rel_path: str) -> str:
    drive = os.environ["ONEDRIVE_DRIVE_ID"]
    base  = os.environ.get("DATA_BASE_PATH", "")
    full  = f"{base}/{rel_path}" if base else rel_path
    enc   = requests.utils.quote(full, safe="/")
    return f"{GRAPH}/drives/{drive}/root:/{enc}"

def get_workbook(rel_path: str, read_only=True):
    """Download and open an Excel file from OneDrive. READ ONLY by default."""
    resp = requests.get(_drive_url(rel_path) + ":/content", headers=_headers(), timeout=30)
    resp.raise_for_status()
    return load_workbook(io.BytesIO(resp.content), read_only=read_only, data_only=True)

def put_workbook(wb, rel_path: str):
    """Upload a modified workbook back to OneDrive. ONLY for comment write-back."""
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    resp = requests.put(
        _drive_url(rel_path) + ":/content",
        headers={**_headers(),
                 "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        data=buf.read(), timeout=60
    )
    resp.raise_for_status()
    log.info("Uploaded: %s", rel_path)

def list_folder(rel_path: str) -> list[dict]:
    """List files in an OneDrive folder. Returns [{name, id, lastModifiedDateTime}]."""
    resp = requests.get(_drive_url(rel_path) + ":/children", headers=_headers(), timeout=15)
    resp.raise_for_status()
    return resp.json().get("value", [])
```

### 1.4 `cache.py`

```python
import time, threading, logging
from typing import Any, Callable, Optional

log = logging.getLogger(__name__)
_store: dict[str, tuple[Any, float]] = {}
_lock = threading.Lock()

def get(key: str) -> Optional[Any]:
    with _lock:
        if key in _store:
            val, exp = _store[key]
            if time.time() < exp:
                return val
            del _store[key]
    return None

def set(key: str, value: Any, ttl: int) -> None:
    with _lock:
        _store[key] = (value, time.time() + ttl)

def invalidate(key: str) -> None:
    with _lock:
        _store.pop(key, None)

def invalidate_all() -> None:
    with _lock:
        _store.clear()

def get_or_load(key: str, ttl: int, loader: Callable) -> Any:
    """Return cached value or call loader(), cache result, return it."""
    val = get(key)
    if val is not None:
        return val
    val = loader()
    set(key, val, ttl)
    return val

# Background refresh — warms cache before TTL expires
_refresh_registry: dict[str, tuple[int, Callable]] = {}

def register_refresh(key: str, ttl: int, loader: Callable) -> None:
    _refresh_registry[key] = (ttl, loader)

def _refresh_worker():
    while True:
        time.sleep(60)
        for key, (ttl, loader) in list(_refresh_registry.items()):
            val = get(key)
            if val is None:  # expired or never loaded
                try:
                    new_val = loader()
                    set(key, new_val, ttl)
                    log.info("Background refresh: %s", key)
                except Exception as e:
                    log.error("Refresh failed [%s]: %s", key, e)

def start_background_refresh():
    t = threading.Thread(target=_refresh_worker, daemon=True)
    t.start()
```

### 1.5 `utils.py` — shared parsing helpers

```python
import math, unicodedata, re
from datetime import datetime, date

def sf(v, default=0.0) -> float:
    """Safe float conversion — handles NaN, None, text."""
    try:
        f = float(v)
        return default if math.isnan(f) else f
    except (TypeError, ValueError):
        return default

def sd(v) -> Optional[str]:
    """Safe date → 'YYYY-MM-DD' string."""
    if v is None: return None
    if isinstance(v, (datetime, date)): return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    return s[:10] if len(s) >= 10 and s[4] == '-' else None

def ss(v) -> str:
    if v is None: return ""
    return str(v).strip()

def resolve_id(name: str) -> Optional[str]:
    """Normalize project name for cross-file matching."""
    s = unicodedata.normalize("NFD", str(name).lower().strip())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_") or None

def find_latest_s_sheet(wb, min_col=6, max_col=15, data_start_row=9) -> Optional[str]:
    """Find the highest-numbered S## sheet that contains real data."""
    # Check Config sheet first
    if "Config" in wb.sheetnames:
        v = wb["Config"]["B4"].value
        if v and re.match(r"^S\d{2}$", str(v)):
            return str(v)
    best = None
    for sn in wb.sheetnames:
        m = re.match(r"^S(\d{2})$", sn)
        if not m: continue
        ws = wb[sn]
        for r in range(data_start_row, min(ws.max_row + 1, data_start_row + 25)):
            if any(ws.cell(r, c).value not in (None, "")
                   for c in range(min_col, max_col + 1)):
                n = int(m.group(1))
                if best is None or n > best:
                    best = n
                break
    return f"S{best:02d}" if best else None
```

### Phase 1 Validation

- [ ] `python -c "import sharepoint_client; wb = sharepoint_client.get_workbook('04_CAPEX/CAPEX.xlsx'); print(wb.sheetnames)"` prints sheet list
- [ ] Token refresh works (run twice, second call uses MSAL cache)
- [ ] `cache.get_or_load()` returns cached value on second call
- [ ] Background refresh thread starts without error
- [ ] `.env` is in `.gitignore`, not committed

---

## Phase 2 — Flask API Endpoints

### 2.1 File: `api_data.py` (Blueprint)

```python
from flask import Blueprint, jsonify, request
import cache, sharepoint_client as sp
from parsers import hfo, enr_sites, enr_projects, capex_parser, reporting
import os

api = Blueprint("api", __name__, url_prefix="/api")

def _ttl(key): return int(os.environ.get(f"TTL_{key}", 900))
```

### 2.2 Endpoint Mapping

---

#### `GET /api/hfo-sites`

Replaces: `data_loader.py` + `generate_data.py` + `GET /api/tamatave`

**Excel files read:**

| File | Sheets | Key columns |
|------|--------|------------|
| `01_Energy/Production/HFO/Tamatave/Tamatave_2026_NN.xlsx` | `Daily Data` | 0=date,1=gross_mwh,2=net_mwh,7=run,8=hfo_kgs,10=lube_oil,11=sfoc_gm; DG cols 8-33 (pairs) |
| same | `Specific data oil` | col 7=conso_total, row 8=autonomy |
| same | `Black out` | cols 1-9 |
| same | `HFO specific data NN` | rows 33+: DG headers, conditions, load chart |
| `Diego_2026_NN.xlsx` | `Daily Data`, `Fuel stock`, `Black out`, `Specific data oil`, `HFO specific data NN` | Same structure; `Fuel stock` adds HFO/LFO stock cols 0-3, 8-11 |
| `Majunga_2026_NN.xlsx` | `Brief data` (not `Daily Data`), `Black out` (space), `load chart` | HFO in liters (×0.96); energy in MWh not kWh |
| `Tulear_2026_NN.xlsx` | `DAILY DATA`, `BLACK OUT`, `HFO+LFO DATA`, ` SOLAR` (leading space), `LUBE OIL CONSUMPTION` | Hours as timedelta; HFO in liters |
| `Tamatave_Solar_*.xlsx` | `generation` | col 0=date,3=gross,6=aux,7=net |

**File selection:** `list_folder()` the site directory, find `{SITE}_2026_NN.xlsx` with highest NN; fall back to previous month if current month file missing (set `data_lag: true` in response).

**Calculations performed:**
- SFOC (g/kWh) = `sum(hfo_kg) / sum(gross_mwh) × 1000` (liters × 0.96 for sites using liters)
- SLOC (g/kWh) = `sum(lube_oil) / sum(run_hours)`
- MW disponibles = `sum(engine.mw for engine if status != "maintenance")`
- Disponibilité % = `run_hours / total_period_hours × 100`
- Stock fuel (days) = `current_stock / avg_daily_consumption`
- Blackout count = rows in `Black out` sheet for current period

**Response shape** — must match current JS globals exactly:

```json
{
  "TAMATAVE_LIVE": {
    "name": "Tamatave", "status": "on", "mw": 24.05, "contrat": 32,
    "latestDate": "2026-03-21",
    "groupes": [
      {"id": "DG1", "model": "9L20", "mw": 1.85, "statut": "ok",
       "hfo_kg": 4821, "rh": 23.5, "col_conso": 8, "col_rh": 9}
    ],
    "dailyTrend": [
      {"date": "2026-03-01", "net_mwh": 680.4, "sfoc": 195.2,
       "run": 23.1, "hfo_kgs": 3420, "lube_oil": 28.5}
    ],
    "blackouts": [
      {"date": "2026-03-10", "duration": 2.5, "cause": "...", "description": "..."}
    ],
    "kpis": {
      "sfoc": 195.2, "sloc": 0.84, "dispo": 94.3,
      "stockFuelDays": 12.4, "mwDispo": 24.05
    },
    "data_lag": false
  },
  "DIEGO_LIVE": { "...": "..." },
  "MAJUNGA_LIVE": { "...": "..." },
  "TULEAR_LIVE": { "...": "..." }
}
```

```python
@api.route("/hfo-sites")
def get_hfo_sites():
    key = "hfo_sites"
    return jsonify(cache.get_or_load(key, _ttl("HFO_SITES"), hfo.build_all_sites))
```

---

#### `GET /api/enr-sites`

Replaces: `generate_enr_data.py`

**Excel files read:**

| File | Sheets matched | Columns |
|------|---------------|---------|
| `01_Energy/Production/EnR/DIE_rapport_de_production.xlsx` | Sheets containing French month names + "index" or "prod" | Auto-detected: DATE, INDEX, PRODUCTION KWH, KW, HEURE, IRRADIANCE, couplage/découplage/durée |
| `TMM_rapport de production.xlsx` | Same | Same |
| `MJN_rapport de production.xlsx` | Same | Same |

**Calculations:** Monthly aggregation (totalProdKwh, totalDeliveredKwh, maxPeakKw, avgIrradiance, avgDailyKwh, totalUnschedInterrupt). Production = from "Prod solaire" sheet if available, else delta of index column.

**Response shape** — matches `ENR_SITES`:

```json
{
  "ENR_SITES": [
    {
      "code": "DIE", "name": "Diego",
      "entity": "Diego Green Power",
      "centrale": "Centrale Solaire d'Ankorikahely",
      "loc": "Ankorikahely, Diego", "capacityKwc": 2400, "capacityMw": 2.4,
      "latestDate": "2026-03-21",
      "totalProdKwh": 580000, "avgDailyKwh": 7800, "maxPeakKw": 2100,
      "monthly": [
        {"month": "2026-01", "totalProdKwh": 196000, "totalDeliveredKwh": 192000,
         "avgIrradiance": 5.2, "maxPeakKw": 2100, "daysWithData": 31,
         "avgDailyProdKwh": 6322, "totalUnschedInterrupt": 1.5,
         "dailyProd": [5200, 6800, ...]}
      ],
      "daily": [{"date": "2026-03-21", "prodKwh": 7800, "peakKw": 1980,
                 "irradiance": 5.1, "availHours": 11.2, "couplingHours": 10.8}]
    }
  ]
}
```

---

#### `GET /api/hfo-projects`

Replaces: `generate_hfo_projects.py`

**Excel file:** `01_Energy/Projet/HFO/LISTE PROJET 260217.xlsx`
**Sheet:** default sheet, `header=1` (row 1 = headers)
**Columns:** SITE, PROJET, MOTEUR, `DL initial`, `DL revu`, `Date d'execution`, `Ecart (Jour)`, `Day to go`, COMMENTAIRE, Action, Resp

**Calculations:**
- `status`: `"termine"` if `day_to_go ≤ 0`; `"urgent"` if `0 < day_to_go ≤ 30`; `"en_cours"` if `> 30`; `"indefini"` if NaN
- `categorie`: keyword match on projet name (overhaul / remise / maintenance / scada / installation / autre)
- Aggregation: total, overhauls, urgents, enCours, termines, bySite counts

**Response shape** — matches `HFO_PROJECTS`:

```json
{
  "HFO_PROJECTS": {
    "total": 57, "overhauls": 12, "urgents": 4, "enCours": 23, "termines": 31,
    "sites": ["Antsirabe", "Diego", "Majunga", "Tamatave", "Tuléar"],
    "bySite": {
      "Tamatave": {"total": 18, "overhaul": 4, "urgent": 2, "enCours": 8}
    },
    "projects": [
      {"site": "Tamatave", "projet": "Overhaul DG7", "moteur": "DG7",
       "categorie": "overhaul", "status": "urgent",
       "dlInit": "2026-01-15", "dlRevu": "2026-03-01",
       "dateExec": null, "ecartJours": 45, "dayToGo": 8,
       "commentaire": "...", "action": "...", "resp": "..."}
    ]
  }
}
```

---

#### `GET /api/enr-projects`

Replaces: `generate_enr_projects.py`

**Excel files read (in priority order — later overrides earlier):**

| File | Sheet | Key columns |
|------|-------|------------|
| `01_Energy/Projet/EnR/ENR_Dates_Projets_Budgets.xlsx` | `Master Plan` rows 4→TOTAL | B=name, C=pvMw, D=bessMwh, I=capexM, J=tri, K=engStart, L=engEnd, M=engPct, N=tendDone, O=tendEnd, P=constStart, Q=constEnd, R=costDev, S=costPv, T-AC=quarterly funds (Q3-25→Q4-27), AD=comment |
| `ENR_Cost_Control.xlsx` | `RECAP` rows 5+ | A=name, C=bac, D=forecast, G=ac, H=av_reel, M=spi, P=perf, Q=cpi |
| `ENR_Dashboard_Master.xlsx` | `DATABASE` rows 3+ | B=name, C=loc, F=lead, G=epciste, AD=puissance, AE=prodJour, AD=glissement(col 30) |
| same | `PROJECT STATUS` rows 4+ | B=name, D=stage, K=constProg |
| `ENR_Status_Etudes.xlsx` | `DEVELOPMENT` rows 3+ | A=name, B-L=11 study types (%), O=engProgression |
| `Weekly_Report/Weekly_EnR_Avancement.xlsx` | Latest S## (via Config/B4) rows 9+ | A=id, B=projet, C=resp, D=type, E=puissance, F=phase, G=avancement, H=glissement, I=statut_eng, J=statut_const, K=epc, L=COD, M=blocages, N=actionsS1, O=actions, P=commentaires_dg |
| `Weekly_Report/Weekly_EnR_Paiements.xlsx` | Latest S## or PAIEMENT sheet | B=projet, C=contractant, D=prestation, E=description, G=montant, H=echeance, I=statut, J=actions |

**Key function:** `resolve_id(name)` via `NAME_MAP` + normalized partial matching (see current `generate_enr_projects.py` for the full 50-entry map — keep it verbatim in `parsers/enr_projects.py`).

**Response shape** — matches `window.ENR_PROJECTS_DATA`:

```json
{
  "ENR_PROJECTS_DATA": {
    "generated": "2026-03-22T10:00:00",
    "week": "17/03/2026",
    "source": "SharePoint",
    "projects": [
      {
        "id": "moramanga-1", "name": "Mandrosolar Phase 1 (MSM)",
        "pvMw": 15, "bessMwh": null, "capexM": 12.4, "tri": 18.5,
        "engStart": "2024-06-01", "engEnd": "2025-03-31", "engPct": 100,
        "constStart": "2025-06-01", "constEnd": "2026-05-15",
        "qtr": [{"q": "Q1-26", "a": 2400000}, {"q": "Q2-26", "a": 1800000}],
        "cc": {"bac": 12400000, "ac": 8320000, "spi": 0.87, "cpi": 1.02},
        "loc": "Moramanga", "lead": "Lindon", "epciste": "BLUESKY",
        "phase": "Construction", "avancement": 67, "glissement": 135,
        "statutEtudes": "100%", "statutConst": "67% - Pose modules 6.7MW",
        "blocages": "Retard dédouanement + logistique route",
        "actionsS1": "Pose module solaire 6.7MW",
        "actionsS": "Poursuite installation structures + modules",
        "commentairesDG": "",
        "studies": [
          {"name": "Etude Topographique", "pct": 100},
          {"name": "Etude Geotechnique", "pct": 100}
        ],
        "paiements": {
          "count": 1, "ok": 0, "nok": 1, "totalMGA": 293405798,
          "lines": [{"contractant": "MIDEX", "prestation": "Dédouanement",
                     "montant": 293405798, "devise": "MGA",
                     "echeance": "2026-04-03", "statut": "NOK"}]
        }
      }
    ]
  }
}
```

---

#### `GET /api/capex`

Replaces: `generate_capex.py`

**Excel file:** `04_CAPEX/CAPEX.xlsx`

**Sheets and columns:**

| Sheet | Rows | Columns read |
|-------|------|-------------|
| `ENAT ` | 9–36 | B=name, C=budget_init, E=incurred, F=h1_26, G=h2_26, H=y2027, J=tri, L=start, M=end_init, N=end_rev |
| `LIDERA ` | 9–17 | B=name, C=init, D=revised, E=incurred, F=h1_26, G=h2_26, H=y2027, J=tri, L=start, M=end_init, N=end_rev |
| `LIDERA SERV ` | 9–11 | B=name, C=init, D=revised, E=incurred, J=tri_init, K=tri_rev |
| `HFO ` | 9–56 | B=name (section header if "USD"/"IRR" in value), D=investInit, E=investRevised, F=incurred, M=dateDebInit, N=dateFinInit |
| `IMMO TRAV` | 9–32 | B=name, C=init, D=revised, E=incurred, J=tri, L=start, N=end_rev |
| `IMMO Foncier` | 9–21 | B=name, F=total |
| `VENTURES EXT` | 9–17 (main) + 25–33 (disbursements) | main: B=name, C=init, D=revised, E=incurred, J=tri_init, K=tri_rev; disbursements: B=name, E=disbursed |

**Calculations:**
- `etatPct` = `min(incurred / budget × 100, 100)`
- ENAT: group rows with `(Studies)` suffix into their parent project
- HFO: rows with "USD"/"IRR" in col B are section headers — accumulate sub-rows into the section
- LIDERA: `budget = revised if revised > 0 else init`
- Cashflow indicators: distribute `h1_26 / 6` per month for 6 months, `h2_26 / 6` for next 6
- `status = "over-budget"` if `incurred > budget × 1.1`

**Response shape** — matches `capexData` object consumed by `capex.js`:

```json
{
  "capexData": {
    "enr": {
      "color": "#00ab63", "colorRgb": "116,184,89",
      "title": "EnR — Énergies Renouvelables (ENAT + LIDERA)",
      "projects": [
        {
          "id": "enr-1", "name": "Centrale Diego 2.4MW", "status": "on-track",
          "investInit": "3 200 000 $", "investReel": "—", "deltaInvest": "—",
          "etatEnCours": "2.8 M$", "etatTotal": "3.2 M$", "etatPct": 87,
          "cfIn": [0,0,0,0,0,0], "cfOut": [8,8,8,6,6,6], "cfNet": "—",
          "triInit": "18%", "triReel": "—", "deltaPerf": "up",
          "dateDebInit": "15.01.25", "dateDebReel": "15.01.25",
          "dateFinInit": "30.06.26", "dateFinReel": "—"
        }
      ]
    },
    "hfo": { "color": "#426ab3", "projects": [ "..." ] },
    "immo": { "color": "#FDB823", "projects": [ "..." ] },
    "ventures": { "color": "#f37056", "projects": [ "..." ] }
  }
}
```

---

#### `GET /api/enr-reporting`

Replaces: `generate_reporting.py`

**Excel files read:**

| File | Sheets | Columns |
|------|--------|---------|
| `Weekly_Report/Weekly_EnR_Avancement.xlsx` | All filled S## sheets | Same column map as `/api/enr-projects` (rows 9+, cols 1-17); week date from G3→E3→E2 |
| `Weekly_Report/Weekly_EnR_Paiements.xlsx` | Latest S## or `Paiements` | A=id, B=projet, C=contractant, D=prestation, E=description, F=montant, G=devise, H=echeance, I=statut, J=actions |

**Sheet detection:** `find_latest_s_sheet()` for latest; `_find_all_filled_sheets()` (check cols 6-15, not 16-17) for full history.

**Response shape** — matches `window.REPORTING_ENR`:

```json
{
  "REPORTING_ENR": {
    "week": "17/03/2026",
    "currentSheet": "S11",
    "generated": "2026-03-22T10:00:00",
    "projects": [ "...latest week projects..." ],
    "payments": [
      {"id_projet": "diego-wind-1", "projet": "Diego Wind Ph1",
       "contractant": "AEOLOS", "prestation": "EPC Materiels",
       "description": "50% Manufacturing", "montant": 68317,
       "devise": "USD", "echeance": "2026-01-15", "statut": "OK", "actions": ""}
    ],
    "weeks": {
      "S11": {
        "sheet": "S11", "week": "17/03/2026",
        "projects": [
          {"id": "moramanga-1", "projet": "Mandrosolar Phase 1 (MSM)",
           "responsable": "Lindon", "type": "Solaire", "puissance": 15,
           "phase": "Construction", "avancement": 67, "glissement": 135,
           "statut_eng": "100%", "statut_const": "67% - Pose modules 6.7MW",
           "epc": "BLUESKY", "date_mes_prevue": "2026-05-15",
           "blocages": "Retard dédouanement", "actions_s1": "Pose modules",
           "actions": "Poursuite installation", "commentaires_dg": "", "reponse": ""}
        ]
      },
      "S10": { "..." : "..." }
    }
  }
}
```

---

#### `POST /api/comment/enr` *(write-back — existing, adapted)*

**File:** `Weekly_Report/Weekly_EnR_Avancement.xlsx` (relative path stored in config)
**Operation:** Download → find latest S## → match projectId (col A) → write col P or Q → re-upload

```python
@api.route("/comment/enr", methods=["POST"])
def comment_enr():
    body = request.get_json()
    pid, comment, reponse = body.get("projectId"), body.get("comment"), body.get("reponse")
    path = "01_Energy/Projet/EnR/Weekly_Report/Weekly_EnR_Avancement.xlsx"
    try:
        wb = sp.get_workbook(path, read_only=False)  # writable download
        sheet_name = find_latest_s_sheet(wb)
        if not sheet_name:
            return jsonify({"error": "No active sheet"}), 404
        ws = wb[sheet_name]
        for r in range(6, ws.max_row + 1):
            if ss(ws.cell(r, 1).value) == pid:
                if comment is not None: ws.cell(r, 16).value = comment.strip()
                if reponse is not None: ws.cell(r, 17).value = reponse.strip()
                sp.put_workbook(wb, path)
                cache.invalidate("enr_reporting")
                cache.invalidate("enr_projects")
                return jsonify({"ok": True, "sheet": sheet_name})
        return jsonify({"error": f"Project {pid} not found"}), 404
    except Exception as e:
        if "423" in str(e) or "locked" in str(e).lower():
            return jsonify({"error": "Fichier ouvert dans Excel — fermez-le et réessayez."}), 423
        return jsonify({"error": str(e)}), 500
```

**⚠ Safety:** Only cols 16 (P) and 17 (Q) are ever written. No other cell is touched.

---

#### `POST /api/comment/investments` *(write-back — existing, adapted)*

**File:** `03_ Investments/Reporting/Weekly_Investments_Avancement.xlsx` (fallback to `_v2.xlsx`)
**Operation:** Download → latest S## → match projectId (col A, rows 6+) → write col J (10) or col K (11) → re-upload

**⚠ Safety:** Only cols 10 (J) and 11 (K) are ever written.

---

#### `POST /api/cache/invalidate` *(admin)*

```python
@api.route("/cache/invalidate", methods=["POST"])
def invalidate():
    key = (request.get_json() or {}).get("key", "all")
    if key == "all":
        cache.invalidate_all()
    else:
        cache.invalidate(key)
    return jsonify({"ok": True, "invalidated": key})
```

---

### 2.3 Register background refresh on startup

```python
# In app.py, after app.register_blueprint(api):
import cache
from parsers import hfo, enr_sites, enr_projects, capex_parser, reporting

cache.register_refresh("hfo_sites",     int(os.environ.get("TTL_HFO_SITES", 3600)),    hfo.build_all_sites)
cache.register_refresh("enr_sites",     int(os.environ.get("TTL_ENR_SITES", 3600)),    enr_sites.build)
cache.register_refresh("hfo_projects",  int(os.environ.get("TTL_HFO_PROJECTS", 1800)), enr_projects.build_hfo)
cache.register_refresh("enr_projects",  int(os.environ.get("TTL_ENR_PROJECTS", 900)),  enr_projects.build_enr)
cache.register_refresh("capex",         int(os.environ.get("TTL_CAPEX", 3600)),        capex_parser.build)
cache.register_refresh("enr_reporting", int(os.environ.get("TTL_REPORTING", 900)),     reporting.build)
cache.start_background_refresh()
```

### 2.4 File structure

```
parsers/
  __init__.py
  hfo.py           # HFO site loader — handles all 4 site layouts via SITE_CONFIG
  enr_sites.py     # ENR production loader (DIE/TMM/MJN)
  enr_projects.py  # 6-file merger with resolve_id + NAME_MAP
  capex_parser.py  # CAPEX.xlsx 7-sheet parser
  reporting.py     # All weekly sheets + payments
sharepoint_client.py
cache.py
utils.py
api_data.py
config.py
app.py
```

### Phase 2 Validation

- [ ] `curl localhost:5000/api/hfo-sites` → returns TAMATAVE_LIVE with correct MW value
- [ ] `curl localhost:5000/api/enr-projects` → 21 projects, each with `id`, `phase`, `avancement`
- [ ] `curl localhost:5000/api/capex` → `enr`, `hfo`, `immo`, `ventures` sections present
- [ ] `curl localhost:5000/api/enr-reporting` → `weeks` object with ≥1 S## key
- [ ] Second request to any endpoint is faster (cache hit) — verify via logs
- [ ] `POST /api/comment/enr` with real projectId → 200 OK, check SharePoint file updated
- [ ] `POST /api/comment/enr` while file open in Excel → 423 response
- [ ] Response shapes match `*_data.js` variable structures byte-for-byte (compare with old generated files)

---

## Phase 3 — Frontend Migration

### 3.1 New file: `js/data_loader.js`

Replaces all `<script src="*_data.js">` tags. Assigns the same global variables the section scripts already read.

```javascript
/**
 * data_loader.js
 * Fetches all dashboard data from the Flask API and assigns window globals.
 * Section scripts (energy.js, reporting.js, capex.js, etc.) are unchanged —
 * they read the same window.* variables as before.
 */

const _API_ENDPOINTS = [
  { url: "/api/hfo-sites", assign: d => {
      window.TAMATAVE_LIVE = d.TAMATAVE_LIVE;
      window.DIEGO_LIVE    = d.DIEGO_LIVE;
      window.MAJUNGA_LIVE  = d.MAJUNGA_LIVE;
      window.TULEAR_LIVE   = d.TULEAR_LIVE;
  }},
  { url: "/api/enr-sites",     assign: d => { window.ENR_SITES          = d.ENR_SITES; }},
  { url: "/api/hfo-projects",  assign: d => { window.HFO_PROJECTS        = d.HFO_PROJECTS; }},
  { url: "/api/enr-projects",  assign: d => { window.ENR_PROJECTS_DATA   = d.ENR_PROJECTS_DATA; }},
  { url: "/api/enr-reporting", assign: d => { window.REPORTING_ENR       = d.REPORTING_ENR; }},
  { url: "/api/capex",         assign: d => { window.capexData           = d.capexData; }},
];

async function _fetch(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

window._dataLoaded = false;
window._dataLoadPromise = (async () => {
  const results = await Promise.allSettled(
    _API_ENDPOINTS.map(async ({ url, assign }) => {
      const data = await _fetch(url);
      assign(data);
    })
  );
  const errors = results.filter(r => r.status === "rejected").map(r => r.reason);
  if (errors.length) console.error("[data_loader] Errors:", errors);
  window._dataLoaded = true;
  document.dispatchEvent(new CustomEvent("data:ready", { detail: { errors } }));
})();
```

### 3.2 `index.html` changes

**Remove** (5 lines):
```html
<script src="enr_site_data.js"></script>
<script src="hfo_projects.js"></script>
<script src="site_data.js"></script>
<script src="enr_projects_data.js"></script>
<script src="reporting_data.js"></script>
```

**Add** (1 line, before all section scripts):
```html
<script src="js/data_loader.js"></script>
```

**Add loading screen** (inside `<body>`, before `#app`):
```html
<div id="app-loader" style="position:fixed;inset:0;background:#080b18;display:flex;
  flex-direction:column;align-items:center;justify-content:center;z-index:9999;
  transition:opacity .4s">
  <div style="color:#00ab63;font-family:monospace;font-size:13px">Chargement…</div>
  <div id="app-loader-err" style="color:#E05C5C;font-size:12px;margin-top:12px;display:none"></div>
</div>
```

### 3.3 `shared.js` — gate initialization on data

Replace direct `initApp()` call with:
```javascript
document.addEventListener("data:ready", ({ detail }) => {
  const el = document.getElementById("app-loader");
  if (detail.errors.length) {
    document.getElementById("app-loader-err").textContent =
      "Données partielles — certaines sections peuvent être indisponibles.";
    document.getElementById("app-loader-err").style.display = "block";
  }
  el.style.opacity = "0";
  setTimeout(() => el.style.display = "none", 400);
  initApp();
});

// Hard timeout fallback
setTimeout(() => {
  if (!window._dataLoaded) {
    document.getElementById("app-loader-err").textContent =
      "Impossible de charger les données. Vérifiez la connexion.";
    document.getElementById("app-loader-err").style.display = "block";
  }
}, 15000);
```

### 3.4 Section scripts — no changes required

All section scripts (`energy.js`, `reporting.js`, `properties.js`, `capex.js`, `investments.js`, etc.) read `window.*` globals that are now assigned by `data_loader.js` before `data:ready` fires. **Zero modifications needed** as long as the API response shapes match exactly (validated in Phase 2).

**One exception:** `capex.js` currently defines `enrProjects`/`hfoProjects` as inline vars. After migration it must read from `window.capexData`. This is a 1-line change in `capex.js` — replace the inline data declaration with a reference to `window.capexData`.

### Phase 3 Validation

- [ ] Hard-reload the page → loading screen appears → disappears within 3s on warm cache
- [ ] Energy page renders correctly — HFO site cards, ENR cards, project list
- [ ] Reporting page renders correctly — week selector works, project rows match expected count
- [ ] CAPEX page renders correctly — all 4 sections (EnR, HFO, IMMO, Ventures)
- [ ] DG comment write → UI confirmation → refresh shows updated comment
- [ ] Kill Flask server → loading screen shows error message after 15s (not blank page)
- [ ] DevTools Network tab: no more requests to `site_data.js`, `enr_projects_data.js`, etc.
- [ ] `window.TAMATAVE_LIVE`, `window.ENR_PROJECTS_DATA` etc. available in console after load
- [ ] Static `*_data.js` files are deleted from repo

---

## Phase 4 — Hardening

### 4.1 Error handling matrix

| Failure | Behavior |
|---------|----------|
| SharePoint token expired | MSAL auto-refreshes; if fails, endpoint returns 503 |
| File locked (open in Excel) | Write-back returns 423; GET reads are unaffected (read-only download) |
| File not found on SharePoint | Return cached data if available, else 404 with `{"error": "file_not_found", "path": "..."}` |
| Monthly HFO file missing (new month) | `find_latest_monthly_file()` falls back to previous month; response includes `"data_lag": true` |
| Excel structure changed (column moved) | Parser logs warning with cell reference, returns partial data. Add `assert` checks on header rows at parse start |
| Cache cold (first boot) | Background refresh fires immediately on `register_refresh()`; endpoints block briefly on first call |
| Parsing exception | Log full traceback; return last cached value if available; otherwise 500 |

### 4.2 Logging

```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)
# Key log points:
# - cache hit/miss per endpoint
# - SharePoint download latency
# - Parser warnings (unexpected cell values, missing columns)
# - Write-back success/failure
# - Background refresh cycle
```

### 4.3 `config.py`

```python
import os
from dotenv import load_dotenv
load_dotenv()

class C:
    TENANT_ID      = os.environ["AZURE_TENANT_ID"]
    CLIENT_ID      = os.environ["AZURE_CLIENT_ID"]
    CLIENT_SECRET  = os.environ["AZURE_CLIENT_SECRET"]
    DRIVE_ID       = os.environ["ONEDRIVE_DRIVE_ID"]
    BASE_PATH      = os.environ.get("DATA_BASE_PATH",
                       "Fichiers de DOSSIER DASHBOARD - Data_Dashbords")

    TTL_HFO_SITES    = int(os.environ.get("TTL_HFO_SITES",    3600))
    TTL_ENR_SITES    = int(os.environ.get("TTL_ENR_SITES",    3600))
    TTL_HFO_PROJECTS = int(os.environ.get("TTL_HFO_PROJECTS", 1800))
    TTL_ENR_PROJECTS = int(os.environ.get("TTL_ENR_PROJECTS", 900))
    TTL_CAPEX        = int(os.environ.get("TTL_CAPEX",        3600))
    TTL_REPORTING    = int(os.environ.get("TTL_REPORTING",    900))
    TTL_INVESTMENTS  = int(os.environ.get("TTL_INVESTMENTS",  900))
```

### 4.4 `requirements.txt` additions

```txt
msal>=1.28.0
python-dotenv>=1.0.0
requests>=2.31.0
# existing: flask, openpyxl, pandas, numpy
```

### Phase 4 Validation

- [ ] Restart Flask → first page load completes < 5s (background refresh pre-warmed)
- [ ] Pull network cable mid-request → 503 returned, not unhandled exception
- [ ] Open an Excel file in Excel, POST /api/comment/* → 423 JSON response
- [ ] Check logs after 1 hour → background refresh cycles visible, no crashes
- [ ] Rename a test sheet in CAPEX.xlsx → parser logs warning, doesn't crash
- [ ] `AZURE_CLIENT_SECRET` missing from `.env` → clear startup error, not KeyError traceback

---

## Rollout sequence

```
Week 1  Phase 1 — Azure registration + sharepoint_client.py + cache.py
         Test: get_workbook() works on CAPEX.xlsx

Week 2  Phase 2A — /api/hfo-projects, /api/enr-reporting (simplest parsers)
         Test: curl endpoints, compare with old *_data.js output

Week 3  Phase 2B — /api/enr-projects, /api/capex, /api/hfo-sites, /api/enr-sites
         Test: all endpoints, validate JSON shapes

Week 4  Phase 2C — write-back endpoints adapted to SharePoint
         Test: comment round-trip on staging

Week 5  Phase 3 — js/data_loader.js + index.html swap
         Test: full browser test, delete *_data.js files

Week 6  Phase 4 — hardening, logging, error handling
         Test: failure scenarios, background refresh, load test
```

---

## Files to create / modify / delete

| Action | File |
|--------|------|
| **Create** | `sharepoint_client.py`, `cache.py`, `utils.py`, `config.py`, `api_data.py` |
| **Create** | `parsers/__init__.py`, `parsers/hfo.py`, `parsers/enr_sites.py`, `parsers/enr_projects.py`, `parsers/capex_parser.py`, `parsers/reporting.py` |
| **Create** | `js/data_loader.js`, `.env` |
| **Modify** | `app.py` (register blueprint, remove old routes), `js/shared.js` (gate on data:ready), `js/capex.js` (read window.capexData), `index.html` (swap script tags + add loader), `.gitignore` (add .env) |
| **Delete** | `generate_data.py`, `generate_enr_data.py`, `generate_hfo_projects.py`, `generate_enr_projects.py`, `generate_capex.py`, `generate_reporting.py` |
| **Delete** | `site_data.js`, `enr_site_data.js`, `hfo_projects.js`, `enr_projects_data.js`, `reporting_data.js`, `capex_generated.js` |
| **Keep unchanged** | `data_loader.py` (reference during transition), all section JS files except capex.js, `create_*.py`, `migrate_*.py`, `props_data.js`, `com_data.js`, `investments.js` (still static) |

---

*Generated 2026-03-22. Source of truth: codebase at `C:\tradingbot\filatex-dashboard`. All endpoint response shapes validated against existing `*_data.js` variable structures.*
