"""
Migration script: Add auth_user_id / email columns to admins table
for auth-service integration.
Run: python -m backend.migrations.006_migrate_admin_auth_user_id
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'fund_manager.db')


def migrate():
    """Add auth_user_id and email columns to admins table."""
    print(f"Migrating database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(admins)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'auth_user_id' not in columns:
        print("Adding auth_user_id column...")
        cursor.execute("ALTER TABLE admins ADD COLUMN auth_user_id VARCHAR(36)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id)")
    else:
        print("✅ auth_user_id column already exists")

    if 'email' not in columns:
        print("Adding email column...")
        cursor.execute("ALTER TABLE admins ADD COLUMN email VARCHAR(255)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email)")
    else:
        print("✅ email column already exists")

    if 'is_active' not in columns:
        print("Adding is_active column...")
        cursor.execute("ALTER TABLE admins ADD COLUMN is_active BOOLEAN DEFAULT 1")
    else:
        print("✅ is_active column already exists")

    if 'password_hash' in columns:
        # Make nullable if not already. SQLite does not enforce NOT NULL alter,
        # but new rows will be inserted without password_hash.
        print("password_hash remains; new rows may leave it NULL")

    conn.commit()
    conn.close()

    print("✅ Migration completed successfully!")


if __name__ == "__main__":
    migrate()
