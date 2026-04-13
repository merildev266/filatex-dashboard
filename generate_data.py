"""
Main entry point — generates all dashboard data from Excel sources.

Calls each section's pipeline sequentially:
  1. HFO (Daily_Report_Global.xlsx + per-site monthly)
  2. ENR (per-site EnR production xlsx)
"""
from generate_hfo_data import generate as generate_hfo
from generate_enr_data import generate as generate_enr


def generate():
    print("=" * 60)
    print("  FILATEX DASHBOARD — DATA GENERATION")
    print("=" * 60)

    print("\n[HFO] Generating HFO site data...")
    generate_hfo()

    print("\n[ENR] Generating ENR site data...")
    generate_enr()

    print("\n" + "=" * 60)
    print("  DONE — All data files generated")
    print("=" * 60)


if __name__ == "__main__":
    generate()
