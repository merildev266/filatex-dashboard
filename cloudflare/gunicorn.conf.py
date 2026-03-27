# Gunicorn configuration for production
# Usage: gunicorn -c cloudflare/gunicorn.conf.py app:app

bind = "127.0.0.1:5000"
workers = 2
timeout = 120
accesslog = "cloudflare/logs/access.log"
errorlog = "cloudflare/logs/error.log"
loglevel = "info"
