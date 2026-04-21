import os

# auth.py now refuses to import without JWT_SECRET — supply a deterministic
# test value before any test module imports `auth`.
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
