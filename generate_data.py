"""
Reads Tamatave xlsx files and generates a tamatave_data.js file
that the dashboard can load synchronously.
"""
import json
from data_loader import build_tamatave_data


def generate():
    data = build_tamatave_data()
    if data is None:
        print("No data found in xlsx files")
        return

    js = f"// Auto-generated from Tamatave xlsx files\nconst TAMATAVE_LIVE = {json.dumps(data, default=str)};\n"

    with open("tamatave_data.js", "w", encoding="utf-8") as f:
        f.write(js)

    print(f"Generated tamatave_data.js ({len(js)} bytes)")
    print(f"  Latest date: {data['latestDate']}")
    print(f"  Status: {data['status']}, MW: {data['mw']}")
    print(f"  Engines: {len(data['groupes'])} ({sum(1 for g in data['groupes'] if g['statut'] == 'ok')} running)")
    print(f"  Daily trend: {len(data['dailyTrend'])} days")
    print(f"  Blackouts: {len(data['blackouts'])} events")


if __name__ == "__main__":
    generate()
