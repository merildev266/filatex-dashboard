import os
import sys
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

    def test_must_change_pin_column_exists(self, tmp_db):
        import sqlite3
        conn = sqlite3.connect(tmp_db)
        cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
        assert "must_change_pin" in cols
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


class TestPinFormatValidation:
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


class TestPinStrength:
    @pytest.mark.parametrize("weak", [
        "0000", "1111", "9999", "2222",
        "1234", "4321", "0123", "9876",
        "000000", "111111", "123456", "654321",
        "1212", "2580", "1979",
    ])
    def test_weak_pins_rejected(self, weak):
        assert auth._is_weak_pin(weak) is True
        with pytest.raises(auth.AuthError, match="facile a deviner"):
            auth.validate_pin_strength(weak)

    @pytest.mark.parametrize("strong", [
        "7319", "8427", "1593", "3847",
        "427519", "816352", "945708",
    ])
    def test_strong_pins_accepted(self, strong):
        assert auth._is_weak_pin(strong) is False
        auth.validate_pin_strength(strong)  # should not raise


class TestCreateUser:
    def test_create_user_returns_id_and_username(self, tmp_db):
        result = auth.create_user("Jean", "Rakoto", "j.rakoto@filatex.mg",
                                  "Jean Rakoto", "utilisateur", ["energy.hfo"])
        assert isinstance(result, dict)
        assert isinstance(result["id"], int) and result["id"] > 0
        assert result["username"] == "jean.rakoto"

    def test_created_user_has_default_pin_and_must_change(self, tmp_db):
        auth.create_user("Marie", "Rabe", "m.rabe@filatex.mg",
                         "Marie Rabe", "utilisateur", ["energy"])
        user = auth.get_user_by_username("marie.rabe")
        assert user is not None
        assert user["pin_set"] is True
        assert user["must_change_pin"] is True
        # And logging in with the default PIN succeeds
        result = auth.authenticate("marie.rabe", auth.DEFAULT_PIN, "ua", "1.2.3.4")
        assert result["success"] is True
        assert result["must_change_pin"] is True

    def test_create_duplicate_username_raises(self, tmp_db):
        auth.create_user("Jean", "Rakoto", "", "Jean Rakoto", "utilisateur", ["energy"])
        with pytest.raises(auth.AuthError, match="existe deja"):
            auth.create_user("Jean", "Rakoto", "", "Jean R.", "utilisateur", ["properties"])


class TestLogin:
    def test_successful_login_with_pin(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is True
        assert "token" in result
        assert result["must_change_pin"] is False
        assert result["user"]["username"] == "pmo"

    def test_login_with_default_pin_flags_must_change(self, tmp_db):
        auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        result = auth.authenticate("marie.rabe", auth.DEFAULT_PIN, "ua", "1.2.3.4")
        assert result["success"] is True
        assert result["must_change_pin"] is True

    def test_wrong_pin(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "9999", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "token" not in result

    def test_nonexistent_user_returns_generic_error(self, tmp_db):
        result = auth.authenticate("ghost", "1234", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert result["error"] == "Identifiants incorrects"

    def test_lockout_after_5_failures(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        for _ in range(5):
            auth.authenticate("pmo", "0000", "Mozilla/5.0", "127.0.0.1")
        result = auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert "verrouille" in result.get("error", "").lower()

    def test_inactive_user_returns_generic_error(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        auth.update_user(uid, active=False)
        result = auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        assert result["success"] is False
        assert result["error"] == "Identifiants incorrects"


class TestChangePin:
    def test_change_pin_clears_must_change(self, tmp_db):
        result = auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        auth.change_pin(result["id"], auth.DEFAULT_PIN, "8427")
        user = auth.get_user_by_id(result["id"])
        assert user["must_change_pin"] is False
        # And new PIN works
        login = auth.authenticate("marie.rabe", "8427", "ua", "1.2.3.4")
        assert login["success"] is True
        assert login["must_change_pin"] is False

    def test_change_pin_rejects_weak(self, tmp_db):
        result = auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        with pytest.raises(auth.AuthError, match="facile a deviner"):
            auth.change_pin(result["id"], auth.DEFAULT_PIN, "1234")

    def test_change_pin_rejects_same_as_current(self, tmp_db):
        result = auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        # Attempting to change 0000 -> 0000 fails on the strength check first
        with pytest.raises(auth.AuthError):
            auth.change_pin(result["id"], auth.DEFAULT_PIN, auth.DEFAULT_PIN)

    def test_change_pin_wrong_old_rejected(self, tmp_db):
        result = auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        with pytest.raises(auth.AuthError, match="PIN actuel incorrect"):
            auth.change_pin(result["id"], "9999", "8427")

    def test_change_pin_invalid_format_rejected(self, tmp_db):
        result = auth.create_user("Marie", "Rabe", "", "Marie Rabe", "utilisateur", ["*"])
        with pytest.raises(auth.AuthError, match="4 ou 6 chiffres"):
            auth.change_pin(result["id"], auth.DEFAULT_PIN, "12")

    def test_change_pin_rejects_reusing_previous(self, tmp_db):
        # Covers the case where old != weak but equals the current hash
        uid = auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        with pytest.raises(auth.AuthError, match="different de l'actuel"):
            auth.change_pin(uid, "7319", "7319")


class TestRoleHierarchy:
    def test_super_admin_can_manage_admin(self):
        assert auth.can_manage("super_admin", "admin") is True

    def test_admin_can_manage_utilisateur(self):
        assert auth.can_manage("admin", "utilisateur") is True

    def test_admin_cannot_manage_admin(self):
        assert auth.can_manage("admin", "admin") is False

    def test_admin_cannot_manage_super_admin(self):
        assert auth.can_manage("admin", "super_admin") is False


class TestResetPin:
    def test_reset_pin_sets_default_and_must_change(self, tmp_db):
        uid = auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        auth.reset_pin(uid)
        user = auth.get_user_by_id(uid)
        assert user["pin_set"] is True
        assert user["must_change_pin"] is True
        # Can log in with 0000 after reset
        result = auth.authenticate("pmo", auth.DEFAULT_PIN, "ua", "1.2.3.4")
        assert result["success"] is True
        assert result["must_change_pin"] is True


class TestJWT:
    def test_decode_valid_token(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        result = auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        payload = auth.decode_token(result["token"])
        assert payload["username"] == "pmo"
        assert payload["role"] == "super_admin"
        assert payload["sections"] == ["*"]

    def test_decode_invalid_token_returns_none(self, tmp_db):
        assert auth.decode_token("invalid.token.here") is None


class TestLoginHistory:
    def test_login_recorded_in_history(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("pmo", "0000", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history()
        assert len(history) == 2

    def test_history_filter_by_username(self, tmp_db):
        auth.create_user_with_pin("pmo", "7319", "PMO", "super_admin", ["*"])
        auth.create_user_with_pin("admin1", "8427", "Admin", "admin", ["energy"])
        auth.authenticate("pmo", "7319", "Mozilla/5.0", "127.0.0.1")
        auth.authenticate("admin1", "8427", "Mozilla/5.0", "127.0.0.1")
        history = auth.get_login_history(username="pmo")
        assert len(history) == 1
        assert history[0]["username"] == "pmo"
