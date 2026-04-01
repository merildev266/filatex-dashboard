from app import app
import os

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    env = os.environ.get("FLASK_ENV", "production")

    if env == "development":
        app.run(debug=True, host=host, port=port)
    else:
        from waitress import serve
        print(f"Dashboard Filatex en production sur http://{host}:{port}")
        serve(app, host=host, port=port)
