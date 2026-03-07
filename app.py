"""
Flask application serving the Filatex PMO Dashboard.
Reads Tamatave xlsx data and provides it via JSON API.
"""
from flask import Flask, jsonify, send_from_directory
from data_loader import build_tamatave_data

app = Flask(__name__, static_folder=".", static_url_path="")


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/tamatave")
def api_tamatave():
    data = build_tamatave_data()
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
