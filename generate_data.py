"""
Reads Tamatave and Diego xlsx files and generates JS data files
that the dashboard can load synchronously.
"""
import json
from data_loader import build_site_data


def generate():
    sites = {
        "tamatave": "TAMATAVE_LIVE",
        "diego": "DIEGO_LIVE",
        "majunga": "MAJUNGA_LIVE",
        "tulear": "TULEAR_LIVE",
    }

    all_js = "// Auto-generated from xlsx files\n"

    for site_key, js_var in sites.items():
        data = build_site_data(site_key)
        if data is None:
            print(f"  {site_key}: No data found")
            continue

        all_js += f"const {js_var} = {json.dumps(data, default=str)};\n"

        running = sum(1 for g in data["groupes"] if g["statut"] == "ok")
        print(f"  {site_key}: status={data['status']}, MW={data['mw']}, "
              f"{len(data['groupes'])} engines ({running} running), "
              f"{len(data['dailyTrend'])} days, {len(data['blackouts'])} blackouts")

    with open("site_data.js", "w", encoding="utf-8") as f:
        f.write(all_js)

    print(f"\nGenerated site_data.js ({len(all_js)} bytes)")


if __name__ == "__main__":
    generate()
