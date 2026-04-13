"""
Orchestrator — builds the enriched HFO site data bundle and writes site_data.js.

Pipeline:
    data_loader.build_site_data()   -> per-site time series (monthly xlsx)
    hfo_global_loader.load_global() -> overhaul / recap / situation / hebdo

All sources are merged into one dict per site, plus a shared HFO_GLOBAL
dict containing the cross-site overhaul list + VESTOP total contract and
constants.

Key data model (after the April 2026 refresh):
  - `groupes` is replaced by the full Situation moteurs list (ENELEC + VESTOP
    combined) so the dashboard sees every engine with the correct provider.
  - Contracts come from `cfg.SITE_CONTRACTS` (from the master XLSX), not RECAP.
  - `puissanceHebdo` holds per-week MW lists (enelec/vestop/peakLoad/contrat)
    extracted from the HEBDO sheet totals — this is the weekly "puissance
    previsionnelle" shown at every level.
  - `previsionnel` (production forecast) is NOT loaded — we only keep
    puissance previsionnelle.

Writes:
    site_data.js  — overwrites the existing file (same export names:
                    TAMATAVE_LIVE / DIEGO_LIVE / MAJUNGA_LIVE / TULEAR_LIVE /
                    ANTSIRABE_LIVE + HFO_GLOBAL)
"""
import json

from data_loader import build_site_data
import hfo_config as cfg
from hfo_global_loader import load_global


# Site keys + generated JS variable name
SITES = {
    "tamatave":  "TAMATAVE_LIVE",
    "diego":     "DIEGO_LIVE",
    "majunga":   "MAJUNGA_LIVE",
    "tulear":    "TULEAR_LIVE",
    "antsirabe": "ANTSIRABE_LIVE",
}


def _compute_jour_arret(engine):
    """Compute days since engine stopped (from stopDate to today)."""
    sd = engine.get("stopDate")
    if not sd or engine.get("statutNorm") == "ok":
        return 0
    from datetime import date
    try:
        d = date.fromisoformat(str(sd)[:10])
        return max(0, (date.today() - d).days)
    except (ValueError, TypeError):
        return 0


def _build_groupes_from_situation(situation_list, build_groupes=None):
    """Convert situation moteurs entries into the `groupes` shape expected
    by the frontend. Every engine has a provider, nominal, attendu and
    availableMw from Situation.

    If build_groupes is provided (from build_site_data), merge per-DG
    time-series arrays (dailyMaxLoad, dailyProd, monthlyMaxLoad,
    monthlyProd, etc.) into the situation-based objects."""
    # Build a lookup of time-series data from build_site_data groupes
    # Situation IDs are like "ADG 1", "DDG 3", data_loader IDs are "DG1", "DG3"
    # Match by extracting the DG number from both
    import re as _re
    ts_lookup = {}
    if build_groupes:
        for bg in build_groupes:
            bg_id = bg.get("id", "")
            ts_lookup[bg_id] = bg
            # Also index by DG number for cross-format matching
            m = _re.search(r"(\d+)", bg_id)
            if m:
                ts_lookup[f"_num_{m.group(1)}"] = bg

    # Keys to copy from build_site_data groupes (time-series arrays)
    _TS_KEYS = [
        "dailyProd", "dailyHours", "dailyHFO", "dailyLFO",
        "dailyOilConso", "dailyOilTopUp", "dailyMaxLoad", "dailyConsLVMV",
        "dailyStandby", "dailyArretForce", "dailyArretPlanifie",
        "monthlyProd", "monthlyHours", "monthlyHFO", "monthlyLFO",
        "monthlyOilConso", "monthlyOilTopUp", "monthlyMaxLoad", "monthlyConsLVMV",
    ]

    groupes = []
    for e in situation_list:
        g = {
            "id":          e.get("id"),
            "model":       f'{e.get("make", "")} {e.get("model", "")}'.strip(),
            "mw":          e.get("nominal") or 0,
            "nominal":     e.get("nominal"),
            "attendu":     e.get("attendu"),
            "availableMw": e.get("availableMw"),
            "statut":      e.get("statutNorm"),
            "condition":   e.get("statut", ""),
            "provider":    e.get("provider"),
            "fuel":        e.get("fuel"),
            "contradictory": False,
            "jourArret":   _compute_jour_arret(e),
        }

        # Merge time-series from build_site_data if DG id matches
        dg_id = g["id"] or ""
        ts = ts_lookup.get(dg_id)
        if not ts:
            # Try matching by DG number (e.g. "ADG 1" → number "1" → "DG1")
            m = _re.search(r"(\d+)", dg_id)
            if m:
                ts = ts_lookup.get(f"_num_{m.group(1)}")
        if ts:
            for key in _TS_KEYS:
                if key in ts and ts[key]:
                    g[key] = ts[key]

        groupes.append(g)
    return groupes


def _build_contracts(site_key):
    """Authoritative contract values from cfg.SITE_CONTRACTS."""
    c = cfg.SITE_CONTRACTS.get(site_key, {"enelec": 0.0, "vestop": 0.0})
    enelec = c.get("enelec", 0.0) or 0.0
    vestop = c.get("vestop", 0.0) or 0.0
    return {
        "enelec": round(enelec, 2),
        "vestop": round(vestop, 2),
        "total":  round(enelec + vestop, 2),
    }


def _build_puissance_hebdo(hebdo_entry):
    """Extract the per-week MW lists from the HEBDO totals block."""
    if not hebdo_entry:
        return {"weeks": [], "enelec": [], "vestop": [], "peakLoad": [], "contrat": []}
    totals = hebdo_entry.get("totals", {}) or {}
    return {
        "weeks":    hebdo_entry.get("weeks", []),
        "enelec":   totals.get("enelec")   or [],
        "vestop":   totals.get("vestop")   or [],
        "peakLoad": totals.get("peakLoad") or [],
        "contrat":  totals.get("contrat")  or [],
    }


def _peak_load_latest(puissance_hebdo):
    """Return the latest non-null peakLoad value (most recent week) or None."""
    pl = puissance_hebdo.get("peakLoad") or []
    for v in reversed(pl):
        if v is not None:
            return round(float(v), 2)
    return None


def _dispo_sum(groupes):
    """Sum of availableMw across all engines."""
    total = 0.0
    for g in groupes:
        v = g.get("availableMw")
        if v is not None:
            try:
                total += float(v)
            except (TypeError, ValueError):
                pass
    return round(total, 2)


def _site_overhauls(overhaul_list, site_key):
    """Return only the overhaul rows that belong to this site."""
    return [o for o in overhaul_list if o.get("siteKey") == site_key]


def _build_stub_site(site_key, display_name, global_data):
    """Build a site object from Global-only sources (no monthly xlsx)."""
    situation = global_data["situation"].get(site_key, [])
    groupes   = _build_groupes_from_situation(situation)
    return {
        "name":        display_name,
        "status":      "warn",
        "mw":          0,
        "contrat":     0,
        "latestDate":  None,
        "groupes":     groupes,
        "kpi":         {"24h": {}, "month": {}, "year": {}, "full_year": {}},
        "dailyTrend":  [],
        "blackouts":   [],
        "blackoutStats": {},
        "fuelStock":   {},
        "stationUse":  {},
    }


def generate():
    print("[1/2] Loading Global (Daily_Report_Global.xlsx)...")
    global_data = load_global()
    print(f"      overhauls={len(global_data['overhaul'])}, "
          f"recap sites={list(global_data['recap'].keys())}, "
          f"situation sites={list(global_data['situation'].keys())}")

    print("[2/2] Building per-site data bundles...")
    all_js = "// Auto-generated by generate_hfo_data.py\n"

    for site_key, js_var in SITES.items():
        if site_key == "antsirabe":
            site = _build_stub_site(site_key, "Antsirabe", global_data)
        else:
            site = build_site_data(site_key)
            if site is None:
                print(f"  {site_key}: SKIP (no monthly data)")
                continue

        # ── Replace groupes with the full Situation moteurs list (all providers) ──
        # Merge per-DG time-series from build_site_data into situation groupes
        situation = global_data["situation"].get(site_key, [])
        if situation:
            build_groupes = site.get("groupes", [])
            site["groupes"] = _build_groupes_from_situation(situation, build_groupes)

        # ── Enrich with Global ──
        site["situationMoteurs"] = situation
        site["planning"]         = global_data["hebdo"].get(site_key, {})
        site["overhauls"]        = _site_overhauls(global_data["overhaul"], site_key)

        # ── Authoritative contracts (from master XLSX via cfg.SITE_CONTRACTS) ──
        contracts = _build_contracts(site_key)
        site["contracts"] = contracts
        site["contrat"]   = contracts["enelec"]  # legacy alias

        # ── Puissance previsionnelle hebdomadaire (weekly MW) ──
        puissance_hebdo = _build_puissance_hebdo(site["planning"])
        site["puissanceHebdo"] = puissance_hebdo

        # ── Computed aggregates ──
        site["dispoTotal"] = _dispo_sum(site["groupes"])
        site["peakLoadLatest"] = _peak_load_latest(puissance_hebdo)
        site["mw"] = site["dispoTotal"]  # legacy alias

        all_js += f"export const {js_var} = {json.dumps(site, default=str, ensure_ascii=False)};\n"

        running = sum(1 for g in site.get("groupes", []) if g.get("statut") == "ok")
        print(f"  {site_key}: {len(site.get('groupes', []))} engines ({running} running), "
              f"ENELEC={contracts['enelec']} MW / VESTOP={contracts['vestop']} MW, "
              f"dispo={site['dispoTotal']} MW, peakLoad={site['peakLoadLatest']}, "
              f"overhauls={len(site['overhauls'])}")

    # Add Fihaonana (under-construction placeholder)
    fihaonana_contracts = _build_contracts("fihaonana")
    fihaonana = {
        "name":    "Fihaonana",
        "status":  "construction",
        "mw":      0,
        "contrat": fihaonana_contracts["enelec"],
        "contracts": fihaonana_contracts,
        "groupes": [],
        "puissanceHebdo": _build_puissance_hebdo(global_data["hebdo"].get("fihaonana")),
        "planning": global_data["hebdo"].get("fihaonana", {}),
        "overhauls": _site_overhauls(global_data["overhaul"], "fihaonana"),
        "dispoTotal": 0,
        "peakLoadLatest": None,
    }
    all_js += f"export const FIHAONANA_LIVE = {json.dumps(fihaonana, default=str, ensure_ascii=False)};\n"

    # HFO_GLOBAL — top-level shared state
    hfo_global = {
        "vestopTotalContract": cfg.VESTOP_TOTAL_CONTRACT,
        "objSfoc":              cfg.OBJ_SFOC,
        "objSloc":              cfg.OBJ_SLOC,
        "overhauls":            global_data["overhaul"],
        "recap":                global_data["recap"],
        "hebdoWeeks":           (
            global_data["hebdo"].get("tamatave") or {}
        ).get("weeks", []),
    }
    all_js += f"export const HFO_GLOBAL = {json.dumps(hfo_global, default=str, ensure_ascii=False)};\n"

    # Write to both the legacy root location AND the frontend source folder
    # so the React dev server picks it up without a manual copy.
    import os as _os
    targets = [
        "site_data.js",
        _os.path.join("frontend", "src", "data", "site_data.js"),
    ]
    for tgt in targets:
        with open(tgt, "w", encoding="utf-8") as f:
            f.write(all_js)
        print(f"Wrote {tgt} ({len(all_js)} bytes)")


if __name__ == "__main__":
    generate()
