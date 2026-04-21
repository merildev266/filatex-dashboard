"""
Flask application serving the Filatex PMO Dashboard.
Reads Tamatave xlsx data and provides it via JSON API.
Supports DG comment writing back to Excel files.
"""
import os, re, subprocess, threading, time, openpyxl
from flask import Flask, jsonify, request, send_from_directory, make_response
from data_loader import build_tamatave_data
import auth
from functools import wraps

app = Flask(__name__, static_folder=".", static_url_path="")

IS_PRODUCTION = os.environ.get("FLASK_ENV", "").lower() == "production"

# CORS — whitelist from env (comma-separated). Dev default: any localhost origin.
# Example for prod: ALLOWED_ORIGINS="https://dashboard.filatex.mg,https://filatex.github.io"
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []

def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    if ALLOWED_ORIGINS:
        return origin in ALLOWED_ORIGINS
    # Dev-only fallback: accept any localhost origin when no explicit whitelist is configured.
    # In production, ALLOWED_ORIGINS MUST be set — otherwise no browser can reach the API.
    return (not IS_PRODUCTION) and origin.startswith("http://localhost:")


def _apply_cors(response, origin):
    if _is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


@app.after_request
def add_cors(response):
    _apply_cors(response, request.headers.get("Origin", ""))
    # HSTS in production so browsers refuse downgrades to HTTP.
    if IS_PRODUCTION:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


@app.before_request
def _security_gate():
    # Enforce HTTPS in production: reject any plain-HTTP request.
    if IS_PRODUCTION and request.headers.get("X-Forwarded-Proto", request.scheme) != "https":
        return jsonify({"error": "HTTPS requis"}), 400
    if request.method == "OPTIONS":
        return _apply_cors(make_response(), request.headers.get("Origin", ""))


# Rate-limit auth endpoints per IP to throttle brute-force + enumeration.
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(get_remote_address, app=app, default_limits=[])
except ImportError:  # flask-limiter optional — warn but don't crash.
    limiter = None
    print("[app] flask-limiter non installe — endpoints d'auth non rate-limites", flush=True)


def _auth_rate_limit(rule):
    """Decorator that applies a flask-limiter rule if the library is available,
    else returns the function unchanged."""
    if limiter is None:
        return lambda f: f
    return limiter.limit(rule, methods=["POST"], error_message="Trop de tentatives. Reessayez plus tard.")


auth.init_db()
auth.seed_pmo()

BASE_ENR = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "01_Energy", "Projet", "EnR"
)
BASE_INV = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "03_ Investments", "Reporting"
)


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = auth.decode_token(token)
        if payload is None:
            return jsonify({"error": "Non autorise"}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Require admin or super_admin role."""
    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if request.user.get("role") not in ("super_admin", "admin"):
            return jsonify({"error": "Acces reserve aux administrateurs"}), 403
        return f(*args, **kwargs)
    return decorated


def require_super_admin(f):
    """Require super_admin role only."""
    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        if request.user.get("role") != "super_admin":
            return jsonify({"error": "Acces reserve au super administrateur"}), 403
        return f(*args, **kwargs)
    return decorated


def _find_latest_sheet(wb):
    """Find the latest filled S## sheet in a workbook.
    Checks user-editable columns (6+) to distinguish filled vs template-only sheets.
    """
    # First check Config sheet for explicit setting
    if "Config" in wb.sheetnames:
        cfg_val = wb["Config"]["B4"].value
        if cfg_val and re.match(r"^S\d{2}$", str(cfg_val)):
            return str(cfg_val)

    latest = None
    for sn in wb.sheetnames:
        m = re.match(r"^S(\d{2})$", sn)
        if not m:
            continue
        ws = wb[sn]
        # Check editable columns (6+: Phase, Avancement, etc.) for real user data
        has_data = False
        for r in range(9, min(ws.max_row + 1, 35)):
            for c in range(6, min(ws.max_column + 1, 18)):
                v = ws.cell(r, c).value
                if v is not None and str(v).strip():
                    has_data = True
                    break
            if has_data:
                break
        if has_data:
            num = int(m.group(1))
            if latest is None or num > latest:
                latest = num
    return f"S{latest:02d}" if latest else None


@app.route("/api/health")
def api_health():
    """Health check — used by frontend to detect if server is running."""
    return jsonify({"ok": True, "version": "2.0"})


@app.route("/")
def index():
    """Serve React build."""
    dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
    return send_from_directory(dist_dir, "index.html")


@app.route("/api/tamatave")
def api_tamatave():
    data = build_tamatave_data()
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(data)


@app.route("/api/comment/enr", methods=["POST"])
@require_auth
def save_enr_comment():
    """Save a DG comment and/or response for an EnR project into the weekly Excel file."""
    data = request.get_json()
    if not data or "projectId" not in data:
        return jsonify({"error": "projectId required"}), 400

    pid = data["projectId"]
    comment = data.get("comment")
    reponse = data.get("reponse")
    if comment is None and reponse is None:
        return jsonify({"error": "comment or reponse required"}), 400

    # Find the weekly file
    path = os.path.join(BASE_ENR, "Weekly_Report", "Weekly_EnR_Avancement.xlsx")
    if not os.path.exists(path):
        path = os.path.join(BASE_ENR, "Weekly_EnR_Avancement.xlsx")
    if not os.path.exists(path):
        return jsonify({"error": "Weekly EnR file not found"}), 404

    try:
        wb = openpyxl.load_workbook(path)
        sheet_name = _find_latest_sheet(wb)
        if not sheet_name:
            wb.close()
            return jsonify({"error": "No active weekly sheet found"}), 404

        ws = wb[sheet_name]
        # comDG = column 16 (P), Reponse = column 17 (Q)
        col_com = 16
        col_rep = 17
        updated = False
        for r in range(6, ws.max_row + 1):
            cell_pid = ws.cell(r, 1).value
            if cell_pid and str(cell_pid).strip() == pid:
                if comment is not None:
                    ws.cell(r, col_com).value = comment.strip()
                if reponse is not None:
                    ws.cell(r, col_rep).value = reponse.strip()
                updated = True
                break

        if not updated:
            wb.close()
            return jsonify({"error": f"Project {pid} not found in {sheet_name}"}), 404

        wb.save(path)
        wb.close()
        return jsonify({"ok": True, "sheet": sheet_name, "project": pid})

    except PermissionError:
        return jsonify({"error": "Fichier Excel ouvert dans une autre application. Fermez-le et reessayez."}), 423
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/comment/investments", methods=["POST"])
@require_auth
def save_inv_comment():
    """Save a DG comment and/or response for an Investments project into the weekly Excel file."""
    data = request.get_json()
    if not data or "projectId" not in data:
        return jsonify({"error": "projectId required"}), 400

    pid = data["projectId"]
    comment = data.get("comment")
    reponse = data.get("reponse")
    if comment is None and reponse is None:
        return jsonify({"error": "comment or reponse required"}), 400

    # Find the weekly file
    path = os.path.join(BASE_INV, "Weekly_Investments_Avancement.xlsx")
    if not os.path.exists(path):
        path = os.path.join(BASE_INV, "Weekly_Investments_Avancement_v2.xlsx")
    if not os.path.exists(path):
        return jsonify({"error": "Weekly Investments file not found"}), 404

    try:
        wb = openpyxl.load_workbook(path)
        sheet_name = _find_latest_sheet(wb)
        if not sheet_name:
            wb.close()
            return jsonify({"error": "No active weekly sheet found"}), 404

        ws = wb[sheet_name]
        # commentaires DG = column 10 (J), Reponse = column 11 (K)
        col_com = 10
        col_rep = 11
        updated = False
        for r in range(6, ws.max_row + 1):
            cell_pid = ws.cell(r, 1).value
            if cell_pid and str(cell_pid).strip() == pid:
                if comment is not None:
                    ws.cell(r, col_com).value = comment.strip()
                if reponse is not None:
                    ws.cell(r, col_rep).value = reponse.strip()
                updated = True
                break

        if not updated:
            wb.close()
            return jsonify({"error": f"Project {pid} not found in {sheet_name}"}), 404

        wb.save(path)
        wb.close()
        return jsonify({"ok": True, "sheet": sheet_name, "project": pid})

    except PermissionError:
        return jsonify({"error": "Fichier Excel ouvert dans une autre application. Fermez-le et reessayez."}), 423
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/filatex-dashboard/")
@app.route("/filatex-dashboard/<path:path>")
def serve_react_basepath(path=""):
    """Serve the React build under /filatex-dashboard/ to match Vite's base path."""
    dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
    if path and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, "index.html")


@app.route("/<path:path>")
def serve_react(path):
    """Serve React static assets or fallback to index.html for SPA routing."""
    dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
    if os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, "index.html")


# --- Data refresh ---

# Track refresh state so we don't run multiple times concurrently
_refresh_lock = threading.Lock()
_refresh_status = {"running": False, "last_run": None, "last_error": None}

GENERATE_SCRIPTS = [
    "generate_data.py",          # HFO + ENR production (calls both)
    "generate_enr_projects.py",  # ENR projects
    "generate_hfo_projects.py",  # HFO projects
    "generate_capex.py",
    "generate_reporting.py",
    "generate_com_reporting.py",
]


import shutil

# Map generated files at root → frontend/src/data/ destination
_JS_COPY_MAP = {
    "site_data.js": "frontend/src/data/site_data.js",
    "enr_site_data.js": "frontend/src/data/enr_site_data.js",
    "enr_projects_data.js": "frontend/src/data/enr_projects_data.js",
    "hfo_projects.js": "frontend/src/data/hfo_projects.js",
    "capex_generated.js": "frontend/src/data/capex_data.js",
    "reporting_data.js": "frontend/src/data/reporting_data.js",
}


def _run_refresh():
    """Run all generate_*.py scripts sequentially, then copy JS to frontend."""
    root = os.path.dirname(os.path.abspath(__file__))
    errors = []
    for script in GENERATE_SCRIPTS:
        path = os.path.join(root, script)
        if not os.path.exists(path):
            continue
        try:
            result = subprocess.run(
                ["python", path],
                cwd=root,
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                errors.append(f"{script}: {result.stderr[:200]}")
        except Exception as e:
            errors.append(f"{script}: {e}")

    # Copy generated JS files into frontend/src/data/
    for src_name, dst_rel in _JS_COPY_MAP.items():
        src = os.path.join(root, src_name)
        dst = os.path.join(root, dst_rel)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)

    with _refresh_lock:
        _refresh_status["running"] = False
        _refresh_status["last_run"] = time.strftime("%Y-%m-%d %H:%M:%S")
        _refresh_status["last_error"] = "; ".join(errors) if errors else None


@app.route("/api/refresh-data", methods=["POST"])
@require_auth
def api_refresh_data():
    """Trigger regeneration of all *_data.js files from Excel sources."""
    with _refresh_lock:
        if _refresh_status["running"]:
            return jsonify({"ok": True, "status": "already_running"})
        _refresh_status["running"] = True
    # Run in background thread so the login isn't blocked
    threading.Thread(target=_run_refresh, daemon=True).start()
    return jsonify({"ok": True, "status": "started"})


@app.route("/api/refresh-data/status")
@require_auth
def api_refresh_status():
    """Check status of data refresh."""
    with _refresh_lock:
        return jsonify(_refresh_status)


# --- Auth endpoints ---

@app.route("/api/auth/login", methods=["POST"])
@_auth_rate_limit("10 per 5 minutes")
def api_login():
    data = request.get_json()
    username = data.get("username", "").strip() if data else ""
    pin = data.get("pin", "").strip() if data else ""
    if not username:
        return jsonify({"success": False, "error": "Identifiant requis"}), 400
    result = auth.authenticate(
        username,
        pin,
        request.headers.get("User-Agent", ""),
        request.remote_addr or ""
    )
    if result["success"]:
        return jsonify(result)
    return jsonify(result), 401




@app.route("/api/auth/me")
@require_auth
def api_me():
    return jsonify(request.user)


@app.route("/api/auth/change-pin", methods=["POST"])
@require_auth
def api_change_pin():
    """Change own PIN — requires current PIN."""
    data = request.get_json() or {}
    old_pin = str(data.get("old_pin", "")).strip()
    new_pin = str(data.get("new_pin", "")).strip()
    new_pin_confirm = str(data.get("new_pin_confirm", "")).strip()
    if new_pin != new_pin_confirm:
        return jsonify({"error": "Les nouveaux codes PIN ne correspondent pas"}), 400
    user = auth.get_user_by_username(request.user["username"])
    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404
    try:
        auth.change_pin(user["id"], old_pin, new_pin)
    except auth.AuthError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"ok": True})


@app.route("/api/auth/update-display-name", methods=["POST"])
@require_auth
def api_update_display_name():
    """Update own display name. Returns a fresh token with the updated name."""
    data = request.get_json() or {}
    display_name = str(data.get("display_name", "")).strip()
    if not display_name:
        return jsonify({"error": "Nom d'affichage requis"}), 400
    user = auth.get_user_by_username(request.user["username"])
    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404
    auth.update_display_name(user["id"], display_name)
    fresh = auth.get_user_by_username(request.user["username"])
    token = auth._generate_token(fresh)
    return jsonify({
        "ok": True,
        "token": token,
        "user": {
            "username": fresh["username"],
            "display_name": fresh["display_name"],
            "role": fresh["role"],
            "sections": fresh["sections"],
        }
    })


# --- Admin endpoints ---

def _check_hierarchy(actor_role, target_id):
    """Check that actor can manage target. Returns (ok, error_response)."""
    target = auth.get_user_by_id(target_id)
    if not target:
        return False, (jsonify({"error": "Utilisateur introuvable"}), 404)
    if not auth.can_manage(actor_role, target["role"]):
        return False, (jsonify({"error": "Vous ne pouvez pas modifier un utilisateur de rang superieur ou egal"}), 403)
    return True, None


@app.route("/api/admin/users")
@require_admin
def admin_list_users():
    actor_role = request.user.get("role")
    users = auth.get_all_users()
    for u in users:
        u.pop("password_hash", None)
    # Admins only see utilisateurs; super_admin sees everyone
    if actor_role == "admin":
        users = [u for u in users if u["role"] == "utilisateur"]
    return jsonify(users)


@app.route("/api/admin/users", methods=["POST"])
@require_admin
def admin_create_user():
    data = request.get_json()
    required = ["first_name", "last_name", "display_name", "role", "sections"]
    if not data or not all(data.get(k) for k in required):
        return jsonify({"error": "Champs requis: " + ", ".join(required)}), 400
    actor_role = request.user.get("role")
    new_role = data["role"]
    # Admin can only create utilisateurs
    if actor_role == "admin" and new_role != "utilisateur":
        return jsonify({"error": "Vous ne pouvez creer que des utilisateurs"}), 403
    # Only super_admin can create admin
    if new_role == "super_admin":
        return jsonify({"error": "Impossible de creer un super administrateur"}), 403
    # Special accounts (pmo, cpo, dg) use explicit username
    username_override = data.get("username_override", "").strip() or None
    # SPECIAL_USERNAMES matching is case-insensitive (pmo lowercase, DG/CPO uppercase)
    if username_override:
        match = next((s for s in auth.SPECIAL_USERNAMES if s.lower() == username_override.lower()), None)
        if not match:
            return jsonify({"error": f"Username special invalide. Autorises: {', '.join(sorted(auth.SPECIAL_USERNAMES))}"}), 400
        username_override = match  # normalize to canonical case
    try:
        result = auth.create_user(
            data["first_name"], data["last_name"], data.get("email", ""),
            data["display_name"], data["role"], data["sections"],
            username_override=username_override,
        )
        return jsonify({
            "id": result["id"],
            "username": result["username"],
            "default_pin": auth.DEFAULT_PIN,
        }), 201
    except auth.AuthError as e:
        return jsonify({"error": str(e)}), 409


@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@require_admin
def admin_update_user(user_id):
    actor_role = request.user.get("role")
    ok, err = _check_hierarchy(actor_role, user_id)
    if not ok:
        return err
    data = request.get_json()
    # Prevent admin from promoting to admin or super_admin
    new_role = data.get("role")
    if actor_role == "admin" and new_role and new_role != "utilisateur":
        return jsonify({"error": "Vous ne pouvez attribuer que le role utilisateur"}), 403
    auth.update_user(
        user_id,
        display_name=data.get("display_name"),
        role=data.get("role"),
        sections=data.get("sections"),
        active=data.get("active"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
    )
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@require_admin
def admin_delete_user(user_id):
    actor_role = request.user.get("role")
    ok, err = _check_hierarchy(actor_role, user_id)
    if not ok:
        return err
    auth.delete_user(user_id)
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:user_id>/reset-pin", methods=["PUT"])
@require_admin
def admin_reset_pin(user_id):
    """Reset the user's PIN back to DEFAULT_PIN. must_change_pin is set
    so the user is forced to pick a new PIN on next login."""
    actor_role = request.user.get("role")
    ok, err = _check_hierarchy(actor_role, user_id)
    if not ok:
        return err
    auth.reset_pin(user_id)
    return jsonify({"ok": True, "default_pin": auth.DEFAULT_PIN})


@app.route("/api/admin/users/<int:user_id>/unlock", methods=["PUT"])
@require_admin
def admin_unlock_user(user_id):
    actor_role = request.user.get("role")
    ok, err = _check_hierarchy(actor_role, user_id)
    if not ok:
        return err
    auth.unlock_user(user_id)
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:user_id>/toggle-active", methods=["PUT"])
@require_admin
def admin_toggle_active(user_id):
    actor_role = request.user.get("role")
    ok, err = _check_hierarchy(actor_role, user_id)
    if not ok:
        return err
    auth.toggle_active(user_id)
    return jsonify({"ok": True})


@app.route("/api/admin/login-history")
@require_super_admin
def admin_login_history():
    username = request.args.get("username")
    limit = int(request.args.get("limit", 100))
    return jsonify(auth.get_login_history(username=username, limit=limit))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
