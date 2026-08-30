"""Make ``admins.password_hash`` nullable for auth-service users.

Legacy fund-manager databases required every admin to have a local password.
Users provisioned through auth-service do not have one, so SQLite must allow
NULL in this column. SQLite cannot drop a NOT NULL constraint in place; this
migration rebuilds only the admins table while preserving its data, indexes,
and triggers.

Run from the repository root:
    python backend/migrations/007_make_admin_password_nullable.py
"""

from __future__ import annotations

import os
from pathlib import Path
import re
import sqlite3


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "fund_manager.db"
TEMP_TABLE = "admins__migrate_007"


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def migrate(db_path: str | os.PathLike[str] = DEFAULT_DB_PATH) -> None:
    """Remove the legacy NOT NULL constraint without losing admin data."""
    path = Path(db_path)
    print(f"Migrating database: {path}")

    conn = sqlite3.connect(path)
    try:
        columns = conn.execute("PRAGMA table_info(admins)").fetchall()
        if not columns:
            print("admins table does not exist; nothing to migrate")
            return

        password_column = next((column for column in columns if column[1] == "password_hash"), None)
        if password_column is None:
            print("password_hash column does not exist; nothing to migrate")
            return
        if password_column[3] == 0:
            print("password_hash is already nullable")
            return

        create_row = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'admins'"
        ).fetchone()
        if not create_row or not create_row[0]:
            raise RuntimeError("Unable to read the admins table definition")

        nullable_sql, replacements = re.subn(
            r"(\bpassword_hash\b\s+[^,\n]*?)\s+NOT\s+NULL\b",
            r"\1",
            create_row[0],
            count=1,
            flags=re.IGNORECASE,
        )
        if replacements != 1:
            raise RuntimeError("Unable to remove NOT NULL from admins.password_hash")

        create_temp_sql, replacements = re.subn(
            r"^\s*CREATE\s+TABLE\s+(?:\"admins\"|`admins`|\[admins\]|admins)(?=\s|\()",
            f'CREATE TABLE "{TEMP_TABLE}"',
            nullable_sql,
            count=1,
            flags=re.IGNORECASE,
        )
        if replacements != 1:
            raise RuntimeError("Unable to construct the temporary admins table")

        schema_objects = conn.execute(
            """
            SELECT type, name, sql
            FROM sqlite_master
            WHERE tbl_name = 'admins'
              AND type IN ('index', 'trigger')
              AND sql IS NOT NULL
            ORDER BY type, name
            """
        ).fetchall()
        column_list = ", ".join(_quote_identifier(column[1]) for column in columns)
        foreign_keys_enabled = conn.execute("PRAGMA foreign_keys").fetchone()[0]
        conn.execute("PRAGMA foreign_keys = OFF")

        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(f'DROP TABLE IF EXISTS "{TEMP_TABLE}"')
            conn.execute(create_temp_sql)
            conn.execute(
                f'INSERT INTO "{TEMP_TABLE}" ({column_list}) '
                f'SELECT {column_list} FROM "admins"'
            )
            conn.execute('DROP TABLE "admins"')
            conn.execute(f'ALTER TABLE "{TEMP_TABLE}" RENAME TO "admins"')
            for _, _, schema_sql in schema_objects:
                conn.execute(schema_sql)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.execute(f"PRAGMA foreign_keys = {1 if foreign_keys_enabled else 0}")

        migrated_column = next(
            column
            for column in conn.execute("PRAGMA table_info(admins)").fetchall()
            if column[1] == "password_hash"
        )
        if migrated_column[3] != 0:
            raise RuntimeError("admins.password_hash is still NOT NULL after migration")
        if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("SQLite integrity check failed after migration")

        print("Migration completed successfully")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
