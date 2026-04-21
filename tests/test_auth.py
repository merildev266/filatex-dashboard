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


class TestUsernameGeneration:
    def test_simple_name(self):
        assert auth.generate_username("Jean", "Rakoto") == "jean.rakoto"

    def test_accented_name(self):
        assert auth.generate_username("Rene", "Razafindrabe") == "rene.razafindrabe"

    def test_accents_stripped(self):
        assert auth.generate_username("Helene", "Bezara") == "helene.bezara"

    def test_spaces_removed(self):
        assert auth.generate_username("Jean Pierre", "De La Croix") == "jeanpierre.delacroix"


class TestPinValidation:
    def test_valid_4_digits(self):
        auth.validate_pin("1234")  # should not raise

    def test_valid_6_digits(self):
        auth.validate_pin("123456")  # should not raise

    def test_invalid_5_digits(self):
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.validate_pin("12345")

    def test_invalid_letters(self):
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.validate_pin("abcd")

    def test_invalid_empty(self):
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.validate_pin("")


class TestCreateUser:
    def test_create_user_returns_activation_info(self, tmp_db):
        result = auth.create_user("Jean", "Rakoto", "j.rakoto@filatex.mg",
                                  "Jean Rakoto", "utilisateur", ["energy.hfo"])
        assert isinstance(result, dict)
        assert isinstance(result["id"], int) and result["id"] > 0
        assert result["username"] == "jean.rakoto"
        assert isinstance(result["activation_token"], str) and len(result["activation_token"]) >= 20
        assert result["activation_expires_at"]  # ISO timestamp

    def test_username_generated_correctly(self, tmp_db):
        auth.create_user("Marie", "Rabe", "m.rabe@filatex.mg",
                         "Marie Rabe", "utilisateur", ["energy"])
        user = auth.get_user_by_username("marie.rabe")
        assert user is not None
        assert user["first_name"] == "Marie"
        assert user["last_name"] == "Rabe"
        assert user["email"] == "m.rabe@filatex.mg"
        assert user["pin_set"] is False

    def test_create_duplicate_username_raises(self, tmp_db):
        auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError, match="existe deja"):
            auth.create_user("Jean", "Rakoto", "", "Jean R.", "utilisateur", ["properties"])

    def test_create_user_with_pin(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        user = auth.get_user_by_username("pmo")
        assert user["pin_set"] is True
        assert user["role"] == "super_admin"

    def test_get_nonexistent_user_returns_none(self, tmp_db):
        assert auth.get_user_by_username("ghost") is None


class TestSetPin:
    def test_set_pin_on_new_user(self, tmp_db):
        auth.create_user("Test", "User", "", "Test User", "utilisateur", ["energy"])
        user = auth.get_user_by_username("test.user")
        assert user["pin_set"] is False

        auth.set_pin("test.user", "1234")
        user = auth.get_user_by_username("test.user")
        assert user["pin_set"] is True

    def test_set_pin_invalid_rejected(self, tmp_db):
        auth.create_user("Test", "User", "", "Test User", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.set_pin("test.user", "123")


class TestLogin:
    def test_successful_login_with_pin(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is True
        assert "token" in result
        assert result["must_set_pin"] is False
        assert result["user"]["username"] == "pmo"

    def test_unactivated_account_login_fails_with_generic_error(self, tmp_db):
        # Self-service activation via empty-PIN login is disabled — use /activate instead.
        auth.create_user("Test", "User", "", "Test User", "utilisateur", ["energy"])
        result = auth.authenticate("test.user", "", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert result["error"] == "Identifiants incorrects"

    def test_wrong_pin(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "9999", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "token" not in result

    def test_nonexistent_user_returns_generic_error(self, tmp_db):
        # User enumeration protection: unknown username must not be distinguishable.
        result = auth.authenticate("ghost", "1234", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert result["error"] == "Identifiants incorrects"

    def test_lockout_after_5_failures(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        for _ in range(5):
            auth.authenticate("pmo", "0000", "Mozilla/5.0", "127.0.0.1")
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "verrouille" in result.get("error", "").lower()

    def test_inactive_user_returns_generic_error(self, tmp_db):
        # Inactive accounts also use the generic error to prevent enumeration.
        uid = auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.update_user(uid, active=False)
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert result["error"] == "Identifiants incorrects"


class TestActivateAccount:
    def test_activate_happy_path(self, tmp_db):
        info = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        user = auth.activate_account("jean.rakoto", info["activation_token"], "1234")
        assert user["pin_set"] is True
        # Subsequent login with the chosen PIN succeeds
        result = auth.authenticate("jean.rakoto", "1234", "ua", "1.2.3.4")
        assert result["success"] is True

    def test_activate_wrong_token_rejected(self, tmp_db):
        auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError):
            auth.activate_account("jean.rakoto", "wrong-token", "1234")

    def test_activate_token_cleared_after_use(self, tmp_db):
        info = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        auth.activate_account("jean.rakoto", info["activation_token"], "1234")
        user = auth.get_user_by_username("jean.rakoto")
        assert user["activation_token"] == ""
        assert user["activation_expires_at"] is None

    def test_activate_already_activated_rejected(self, tmp_db):
        info = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        auth.activate_account("jean.rakoto", info["activation_token"], "1234")
        with pytest.raises(auth.AuthError):
            auth.activate_account("jean.rakoto", info["activation_token"], "5678")

    def test_activate_unknown_user_rejected(self, tmp_db):
        with pytest.raises(auth.AuthError):
            auth.activate_account("ghost", "anytoken", "1234")

    def test_activate_invalid_pin_rejected(self, tmp_db):
        info = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.activate_account("jean.rakoto", info["activation_token"], "12")


class TestRoleHierarchy:
    def test_super_admin_can_manage_admin(self):
        assert auth.can_manage("super_admin", "admin") is True

    def test_super_admin_can_manage_utilisateur(self):
        assert auth.can_manage("super_admin", "utilisateur") is True

    def test_admin_can_manage_utilisateur(self):
        assert auth.can_manage("admin", "utilisateur") is True

    def test_admin_cannot_manage_admin(self):
        assert auth.can_manage("admin", "admin") is False

    def test_admin_cannot_manage_super_admin(self):
        assert auth.can_manage("admin", "super_admin") is False

    def test_utilisateur_cannot_manage_anyone(self):
        assert auth.can_manage("utilisateur", "utilisateur") is False


class TestResetPin:
    def test_reset_pin_returns_activation_info(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        info = auth.reset_pin(uid)
        user = auth.get_user_by_username("pmo")
        assert user["pin_set"] is False
        assert info["activation_token"] and len(info["activation_token"]) >= 20
        assert user["activation_token"] == info["activation_token"]


class TestRegenerateActivation:
    def test_regenerate_for_unactivated(self, tmp_db):
        initial = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        fresh = auth.regenerate_activation_token(initial["id"])
        assert fresh["activation_token"] != initial["activation_token"]

    def test_regenerate_for_activated_rejected(self, tmp_db):
        info = auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        auth.activate_account("jean.rakoto", info["activation_token"], "1234")
        user = auth.get_user_by_username("jean.rakoto")
        with pytest.raises(auth.AuthError):
            auth.regenerate_activation_token(user["id"])


class TestJWT:
    def test_decode_valid_token(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        payload = auth.decode_token(result["token"])
        assert payload["username"] == "pmo"
        assert payload["role"] == "super_admin"
        assert payload["sections"] == ["*"]

    def test_decode_invalid_token_returns_none(self, tmp_db):
        assert auth.decode_token("invalid.token.here") is None


class TestLoginHistory:
    def test_login_recorded_in_history(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("pmo", "0000", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history()
        assert len(history) == 2
        assert history[0]["success"] is True or history[1]["success"] is True

    def test_history_filter_by_username(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.create_user_with_pin("admin1", "1234", "Admin", "admin", ["energy"])
        auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("admin1", "1234", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history(username="pmo")
        assert len(history) == 1
        assert history[0]["username"] == "pmo"
