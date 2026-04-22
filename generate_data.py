"""
Main entry point — generates all dashboard data from Excel sources.

Runs each section's pipeline sequentially, writing ES module files
directly to frontend/src/data/.

Order matters for dependencies:
  1. HFO site data           (Daily_Report_Global.xlsx + per-site monthly)
  2. ENR site data           (per-site EnR production xlsx)
  3. HFO projects            (LISTE PROJET xlsx)
  4. ENR projects            (per-project xlsx)
  5. Production 2025         (archived monthly/daily)
  6. CAPEX                   (CAPEX xlsx)
  7. Weekly reporting EnR    (Weekly_EnR_Avancement + Paiements)
  8. COM reporting           (COM_Reporting.xlsx)
"""
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ("HFO site data",      "generate_hfo_data.py"),
    ("ENR site data",      "generate_enr_data.py"),
    ("HFO projects",       "generate_hfo_projects.py"),
    ("ENR projects",       "generate_enr_projects.py"),
    ("Production 2025",    "generate_production_2025.py"),
    ("CAPEX",              "generate_capex.py"),
    ("Weekly EnR reporting", "generate_reporting.py"),
    ("COM reporting",      "generate_com_reporting.py"),
]


def generate():
    print("=" * 60)
    print("  FILATEX DASHBOARD — DATA GENERATION")
    print("=" * 60)

    errors = []
    for label, script in STEPS:
        path = os.path.join(ROOT, script)
        if not os.path.exists(path):
            print(f"\n[SKIP] {label}: {script} introuvable")
            continue
        print(f"\n[{label}] Running {script}...")
        result = subprocess.run([sys.executable, path], cwd=ROOT)
        if result.returncode != 0:
            errors.append(f"{script} (exit {result.returncode})")

    print("\n" + "=" * 60)
    if errors:
        print(f"  DONE WITH ERRORS: {', '.join(errors)}")
    else:
        print("  DONE — All data files generated")
    print("=" * 60)


if __name__ == "__main__":
    generate()
