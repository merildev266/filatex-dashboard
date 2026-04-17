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
    def test_create_user_returns_id(self, tmp_db):
        user_id = auth.create_user("Jean", "Rakoto", "j.rakoto@filatex.mg",
                                   "Jean Rakoto", "utilisateur", ["energy.hfo"])
        assert isinstance(user_id, int)
        assert user_id > 0

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

    def test_first_login_must_set_pin(self, tmp_db):
        auth.create_user("Test", "User", "", "Test User", "utilisateur", ["energy"])
        result = auth.authenticate("test.user", "", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is True
        assert result["must_set_pin"] is True

    def test_wrong_pin(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "9999", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "token" not in result

    def test_nonexistent_user(self, tmp_db):
        result = auth.authenticate("ghost", "1234", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False

    def test_lockout_after_5_failures(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        for _ in range(5):
            auth.authenticate("pmo", "0000", "Mozilla/5.0", "127.0.0.1")
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "verrouille" in result.get("error", "").lower()

    def test_inactive_user_cannot_login(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.update_user(uid, active=False)
        result = auth.authenticate("pmo", "2026", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "desactive" in result.get("error", "").lower()


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
    def test_reset_pin(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.reset_pin(uid)
        user = auth.get_user_by_username("pmo")
        assert user["pin_set"] is False


class TestChangePin:
    def test_change_pin_success(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        auth.change_pin("pmo", "2026", "4242")
        # Old PIN rejected, new PIN accepted
        assert auth.authenticate("pmo", "2026", "", "")["success"] is False
        assert auth.authenticate("pmo", "4242", "", "")["success"] is True

    def test_change_pin_wrong_old(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        with pytest.raises(auth.AuthError, match="actuel incorrect"):
            auth.change_pin("pmo", "9999", "4242")

    def test_change_pin_same_rejected(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        with pytest.raises(auth.AuthError, match="different"):
            auth.change_pin("pmo", "2026", "2026")

    def test_change_pin_invalid_new(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.change_pin("pmo", "2026", "12")

    def test_change_pin_empty_old_rejected(self, tmp_db):
        auth.create_user_with_pin("pmo", "2026", "PMO", "super_admin", ["*"])
        with pytest.raises(auth.AuthError, match="actuel est requis"):
            auth.change_pin("pmo", "", "4242")

    def test_change_pin_user_without_pin_rejected(self, tmp_db):
        auth.create_user("Test", "User", "", "Test User", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError, match="PIN non defini"):
            auth.change_pin("test.user", "2026", "4242")


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
