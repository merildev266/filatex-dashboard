import os
import sys
import json
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import auth


@pytest.fixture(autouse=True)
def tmp_db(tmp_path, monkeypatch):
    """Use a temporary database for each test."""
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr(auth, "DB_PATH", db_path)
    auth.init_db()
    return db_path


class TestInitDb:
    def test_creates_users_table(self, tmp_db):
        import sqlite3
        conn = sqlite3.connect(tmp_db)
        cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        assert cur.fetchone() is not None
        conn.close()

    def test_creates_login_history_table(self, tmp_db):
        import sqlite3
        conn = sqlite3.connect(tmp_db)
        cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='login_history'")
        assert cur.fetchone() is not None
        conn.close()


class TestCreateUser:
    def test_create_user_returns_id(self, tmp_db):
        user_id = auth.create_user("testuser", "password123", "Test User", "manager", ["energy.hfo"])
        assert isinstance(user_id, int)
        assert user_id > 0

    def test_create_duplicate_username_raises(self, tmp_db):
        auth.create_user("testuser", "pass", "Test", "manager", ["energy"])
        with pytest.raises(auth.AuthError, match="existe deja"):
            auth.create_user("testuser", "pass2", "Test2", "manager", ["properties"])

    def test_get_user_by_username(self, tmp_db):
        auth.create_user("pmo", "secret", "Le PMO", "pmo", ["*"])
        user = auth.get_user_by_username("pmo")
        assert user["username"] == "pmo"
        assert user["display_name"] == "Le PMO"
        assert user["role"] == "pmo"
        assert user["sections"] == ["*"]
        assert user["active"] is True
        assert user["locked"] is False

    def test_get_nonexistent_user_returns_none(self, tmp_db):
        assert auth.get_user_by_username("ghost") is None


class TestLogin:
    def test_successful_login(self, tmp_db):
        auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        result = auth.authenticate("pmo", "filatex2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is True
        assert "token" in result
        assert result["user"]["username"] == "pmo"

    def test_wrong_password(self, tmp_db):
        auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        result = auth.authenticate("pmo", "wrongpass", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "token" not in result

    def test_nonexistent_user(self, tmp_db):
        result = auth.authenticate("ghost", "pass", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False

    def test_lockout_after_5_failures(self, tmp_db):
        auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        for _ in range(5):
            auth.authenticate("pmo", "wrong", "Mozilla/5.0", "127.0.0.1")
        result = auth.authenticate("pmo", "filatex2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "verrouille" in result.get("error", "").lower()

    def test_inactive_user_cannot_login(self, tmp_db):
        uid = auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        auth.update_user(uid, active=False)
        result = auth.authenticate("pmo", "filatex2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "desactive" in result.get("error", "").lower()


class TestJWT:
    def test_decode_valid_token(self, tmp_db):
        auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        result = auth.authenticate("pmo", "filatex2026", "Mozilla/5.0", "127.0.0.1")
        payload = auth.decode_token(result["token"])
        assert payload["username"] == "pmo"
        assert payload["role"] == "pmo"
        assert payload["sections"] == ["*"]

    def test_decode_invalid_token_returns_none(self, tmp_db):
        assert auth.decode_token("invalid.token.here") is None


class TestLoginHistory:
    def test_login_recorded_in_history(self, tmp_db):
        auth.create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
        auth.authenticate("pmo", "filatex2026", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("pmo", "wrong", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history()
        assert len(history) == 2
        assert history[0]["success"] is True or history[1]["success"] is True

    def test_history_filter_by_username(self, tmp_db):
        auth.create_user("pmo", "pass1", "PMO", "pmo", ["*"])
        auth.create_user("dir", "pass2", "Dir", "directeur", ["energy"])
        auth.authenticate("pmo", "pass1", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("dir", "pass2", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history(username="pmo")
        assert len(history) == 1
        assert history[0]["username"] == "pmo"
