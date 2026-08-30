import importlib.util
from pathlib import Path
import sqlite3


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "backend"
    / "migrations"
    / "007_make_admin_password_nullable.py"
)
SPEC = importlib.util.spec_from_file_location("admin_password_nullable_migration", MIGRATION_PATH)
assert SPEC and SPEC.loader
MIGRATION = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MIGRATION)


def test_migration_preserves_legacy_admins_and_allows_sso_users(tmp_path):
    db_path = tmp_path / "fund_manager.db"
    conn = sqlite3.connect(db_path)
    conn.executescript(
        """
        CREATE TABLE admins (
            id INTEGER NOT NULL,
            username VARCHAR(50) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME,
            auth_user_id VARCHAR(36),
            email VARCHAR(255),
            is_active BOOLEAN DEFAULT 1,
            PRIMARY KEY (id)
        );
        CREATE UNIQUE INDEX ix_admins_username ON admins (username);
        CREATE UNIQUE INDEX idx_admins_auth_user_id ON admins(auth_user_id);
        CREATE UNIQUE INDEX idx_admins_email ON admins(email);
        INSERT INTO admins (
            id, username, password_hash, created_at, auth_user_id, email, is_active
        ) VALUES (
            1, 'legacy-admin', 'legacy-hash', '2026-01-01', NULL,
            'legacy@example.com', 1
        );
        """
    )
    conn.close()

    MIGRATION.migrate(db_path)

    conn = sqlite3.connect(db_path)
    columns = {column[1]: column for column in conn.execute("PRAGMA table_info(admins)")}
    assert columns["password_hash"][3] == 0
    assert columns["username"][3] == 1
    assert conn.execute(
        "SELECT username, password_hash, email FROM admins WHERE id = 1"
    ).fetchone() == ("legacy-admin", "legacy-hash", "legacy@example.com")

    index_names = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'admins'"
        )
    }
    assert {
        "ix_admins_username",
        "idx_admins_auth_user_id",
        "idx_admins_email",
    } <= index_names

    conn.execute(
        """
        INSERT INTO admins (username, auth_user_id, email, is_active)
        VALUES ('sso-viewer', 'auth-user-id', 'viewer@example.com', 1)
        """
    )
    conn.commit()
    assert conn.execute(
        "SELECT password_hash FROM admins WHERE auth_user_id = 'auth-user-id'"
    ).fetchone() == (None,)
    assert conn.execute("PRAGMA integrity_check").fetchone() == ("ok",)
    conn.close()

    MIGRATION.migrate(db_path)
