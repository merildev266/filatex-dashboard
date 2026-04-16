"""
Central configuration for the HFO pipeline.

Groups all paths, constants, color codes and per-site metadata needed by the
HFO-specific loaders (Global, Previsionnel) + the generator orchestrator.

Everything here is data-only: loaders import from this file, never the other
way around, so there are no circular imports.
"""
import os

# ══════════════════════════════════════════════════════════════
# PATHS
# ══════════════════════════════════════════════════════════════

BASE_DIR = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "Bureau",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "01_Energy",
    "1.Production",
    "1.HFO&LFO",
)

GLOBAL_DIR = os.path.join(BASE_DIR, "0.Global")
GLOBAL_FILE = os.path.join(GLOBAL_DIR, "Daily_Report_Global.xlsx")

PREVISIONNEL_DIR = os.path.join(BASE_DIR, "6.Previsionnel")
PREVISIONNEL_FILE = os.path.join(PREVISIONNEL_DIR, "Previsionnel_26.xlsx")

# Per-site monthly production files (dynamic glob — pipeline sorts by date)
SITE_DIRS = {
    "tamatave": os.path.join(BASE_DIR, "1.Tamatave"),
    "diego":    os.path.join(BASE_DIR, "2.Diego"),
    "tulear":   os.path.join(BASE_DIR, "3.Tulear"),
    "majunga":  os.path.join(BASE_DIR, "4.Majunga"),
    "antsirabe": os.path.join(BASE_DIR, "5.Antsirabe"),
}

SITE_FILE_PATTERNS = {
    "tamatave": "Tamatave_2026_*.xlsx",
    "diego":    "Diego_2026_*.xlsx",
    "tulear":   "Tulear_2026_*.xlsx",
    "majunga":  "Majunga_2026_*.xlsx",
    "antsirabe": "Antsirabe_2026_*.xlsx",  # placeholder — no data yet
}


# ══════════════════════════════════════════════════════════════
# VESTOP / ENELEC
# ══════════════════════════════════════════════════════════════

# Total VESTOP contract across all sites (MW).
# Engines can sum to more than this (buffer for failure safety).
VESTOP_TOTAL_CONTRACT = 23.5

# Marker: sites that host VESTOP engines (used for provider split).
SITES_WITH_VESTOP = ("tamatave", "majunga", "antsirabe", "fihaonana")

# Per-site contracts (MW) — authoritative values from
# "Copie de Copie de LISTE MOTEUR HFO SUR SITE (002).xlsx"
# These override any contract data read from RECAP.
SITE_CONTRACTS = {
    "tamatave":  {"enelec": 32.0, "vestop": 6.08},
    "majunga":   {"enelec": 16.3, "vestop": 5.84},
    "diego":     {"enelec": 18.5, "vestop": 0.0},
    "tulear":    {"enelec": 9.9,  "vestop": 0.0},
    "antsirabe": {"enelec": 0.0,  "vestop": 9.0},
    "fihaonana": {"enelec": 0.0,  "vestop": 8.3},
}


# ══════════════════════════════════════════════════════════════
# OBJECTIVES (from Previsionnel_26 headers)
# ══════════════════════════════════════════════════════════════

OBJ_SFOC = 250.0  # g/kWh
OBJ_SLOC = 1.0    # g/kWh


# ══════════════════════════════════════════════════════════════
# HEBDO PLANNING COLOR CODES
# ══════════════════════════════════════════════════════════════

# openpyxl returns fill colors as 8-char ARGB strings.
# Two colors are used in "Détail PP HEBDO":
#   orange (FFFFC000) → Indisponible
#   blue   (FF0070C0) → Maintenance
PLANNING_COLOR_INDISPO     = "FFFFC000"
PLANNING_COLOR_MAINTENANCE = "FF0070C0"

PLANNING_STATUS_BY_COLOR = {
    PLANNING_COLOR_INDISPO:     "indisponible",
    PLANNING_COLOR_MAINTENANCE: "maintenance",
}


# ══════════════════════════════════════════════════════════════
# GLOBAL REPORT SHEETS
# ══════════════════════════════════════════════════════════════

SHEET_OVERHAUL       = "OVERHAUL"
SHEET_RECAP          = "RECAP"
SHEET_SITUATION      = "Situation Moteurs"
SHEET_HEBDO          = "Détails PP HEBDO"
SHEET_DETAIL_TMV     = "Détails PP TMV"
SHEET_DETAIL_DIEGO   = "Détails PP DIE"
SHEET_DETAIL_MJN     = "Détails PP MJN"
SHEET_DETAIL_TUL     = "Détails PP TUL"
SHEET_DETAIL_ABE     = "Détails PP ABE"


# ══════════════════════════════════════════════════════════════
# PREVISIONNEL SHEETS (TANA ignored as per user request)
# ══════════════════════════════════════════════════════════════

PREVISIONNEL_SHEETS = {
    "tamatave":  "PP _ TAMATAVE",
    "majunga":   "PP _ MAJUNGA",
    "diego":     "PP _ DIEGO",
    "antsirabe": "PP _ ANTSIRABE",
    "tulear":    "PP _ TULEAR ",   # trailing space is intentional
}

# Sheets to ignore in Previsionnel_26 (user request)
PREVISIONNEL_IGNORE_SHEETS = ("PP _ TANA",)

# Label of the SFOC / SLOC objective rows in Previsionnel
# (they appear in column A as e.g. "SLOC (Obj 1g/kWh)" or "SFOC (Obj 230g/kWh)")
LABEL_SFOC_OBJ = "SFOC"
LABEL_SLOC_OBJ = "SLOC"


# ══════════════════════════════════════════════════════════════
# FRIENDLY NAMES
# ══════════════════════════════════════════════════════════════

SITE_DISPLAY_NAMES = {
    "tamatave":  "Tamatave",
    "diego":     "Diego",
    "tulear":    "Tuléar",
    "majunga":   "Majunga",
    "antsirabe": "Antsirabe",
    "fihaonana": "Fihaonana",
}

# Key used in each loader's output to identify the provider.
PROVIDER_ENELEC = "enelec"
PROVIDER_VESTOP = "vestop"
PROVIDER_LFO    = "lfo"
