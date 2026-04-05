"""
Reads HFO projects xlsx and generates JS data file for the dashboard.
"""
import json
import pandas as pd
from datetime import datetime

BASE = (
    r"C:\Users\Meril\OneDrive - GROUPE FILATEX"
    r"\Bureau"
    r"\Fichiers de DOSSIER DASHBOARD - Data_Dashbords"
    r"\01_Energy\Projet\HFO"
)
FILE = f"{BASE}\\LISTE PROJET 260217.xlsx"
TODAY = datetime.now()


def categorize(projet_name):
    """Categorize project by type."""
    p = str(projet_name).lower()
    if "overhaul" in p:
        return "overhaul"
    if "remise en service" in p or "remplacement" in p:
        return "remise"
    if "maintenance" in p:
        return "maintenance"
    if "scada" in p:
        return "scada"
    if "installation" in p or "cooling" in p or "calorifusage" in p:
        return "installation"
    return "autre"


def status_from_days(day_to_go, ecart):
    """Determine project status from day_to_go."""
    if pd.isna(day_to_go) or day_to_go < -1000:
        return "indefini"
    if day_to_go <= 0:
        return "termine"
    if day_to_go <= 30:
        return "urgent"
    return "en_cours"


def build_hfo_projects():
    """Build and return HFO projects data dict (for API use). Returns {"HFO_PROJECTS": {...}}."""
    import os
    if not os.path.exists(FILE):
        return {"HFO_PROJECTS": {"total": 0, "overhauls": 0, "urgents": 0, "enCours": 0, "termines": 0, "sites": [], "bySite": {}, "projects": []}}

    df = pd.read_excel(FILE, header=1)
    projects = []
    for _, row in df.iterrows():
        site = str(row.get("SITE", "")).strip()
        projet = str(row.get("PROJET", "")).strip()
        moteur = row.get("MOTEUR", "")
        dl_init = row.get("DL initial")
        dl_revu = row.get("DL revu")
        date_exec = row.get("Date d'execution")
        ecart = row.get("Ecart (Jour)", 0)
        day_to_go = row.get("Day to go", 0)
        commentaire = str(row.get("COMMENTAIRE", "") or "").strip()
        action = str(row.get("Action", "") or "").strip()
        resp = str(row.get("Resp", "") or "").strip()

        if not site or site == "nan" or not projet or projet == "nan":
            continue

        dl_init_str = None
        if pd.notna(dl_init):
            if isinstance(dl_init, str) and not dl_init[:4].isdigit():
                dl_init_str = dl_init
            else:
                try:
                    dl_init_str = pd.Timestamp(dl_init).strftime("%Y-%m-%d")
                except Exception:
                    dl_init_str = str(dl_init)

        dl_revu_str = None
        if pd.notna(dl_revu):
            try:
                dl_revu_str = pd.Timestamp(dl_revu).strftime("%Y-%m-%d")
            except Exception:
                dl_revu_str = str(dl_revu)

        date_exec_str = None
        if pd.notna(date_exec):
            try:
                date_exec_str = pd.Timestamp(date_exec).strftime("%Y-%m-%d")
            except Exception:
                date_exec_str = str(date_exec)

        moteur_str = str(moteur).strip() if pd.notna(moteur) else None
        ecart_val = int(ecart) if pd.notna(ecart) and abs(ecart) < 10000 else None
        dtg_val = int(day_to_go) if pd.notna(day_to_go) and abs(day_to_go) < 10000 else None

        cat = categorize(projet)
        status = status_from_days(dtg_val, ecart_val)

        projects.append({
            "site": site, "projet": projet, "moteur": moteur_str,
            "categorie": cat, "status": status,
            "dlInit": dl_init_str, "dlRevu": dl_revu_str, "dateExec": date_exec_str,
            "ecartJours": ecart_val, "dayToGo": dtg_val,
            "commentaire": commentaire if commentaire != "nan" else None,
            "action": action if action != "nan" else None,
            "resp": resp if resp != "nan" else None,
        })

    sites = sorted(set(p["site"] for p in projects))
    by_site = {}
    for s in sites:
        sp = [p for p in projects if p["site"] == s]
        by_site[s] = {
            "total": len(sp),
            "overhaul": sum(1 for p in sp if p["categorie"] == "overhaul"),
            "urgent": sum(1 for p in sp if p["status"] == "urgent"),
            "enCours": sum(1 for p in sp if p["status"] == "en_cours"),
        }

    data = {
        "total": len(projects),
        "overhauls": sum(1 for p in projects if p["categorie"] == "overhaul"),
        "urgents": sum(1 for p in projects if p["status"] == "urgent"),
        "enCours": sum(1 for p in projects if p["status"] == "en_cours"),
        "termines": sum(1 for p in projects if p["status"] == "termine"),
        "sites": sites, "bySite": by_site, "projects": projects,
    }
    return {"HFO_PROJECTS": data}


def generate():
    result = build_hfo_projects()
    data = result["HFO_PROJECTS"]

    js = f"// Auto-generated from HFO projects xlsx\nconst HFO_PROJECTS = {json.dumps(data, ensure_ascii=False, default=str)};\n"
    with open("hfo_projects.js", "w", encoding="utf-8") as f:
        f.write(js)

    print(f"Generated hfo_projects.js")
    print(f"  {data['total']} projects, {data['urgents']} urgent, {data['enCours']} en cours, {data['termines']} terminés")


if __name__ == "__main__":
    generate()
