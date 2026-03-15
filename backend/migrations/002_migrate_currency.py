"""
Migration script: Add currency column to funds table
Run this to migrate existing database to support currency field
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'fund_manager.db')


def migrate():
    """Add currency column and set default value for existing funds."""
    print(f"Migrating database: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if currency column already exists
    cursor.execute("PRAGMA table_info(funds)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'currency' in columns:
        print("✅ Currency column already exists, skipping migration")
        conn.close()
        return
    
    # Add currency column
    print("Adding currency column...")
    cursor.execute("ALTER TABLE funds ADD COLUMN currency VARCHAR(3) DEFAULT 'CNY'")
    
    # Update existing funds to have currency = 'CNY'
    print("Setting default currency for existing funds...")
    cursor.execute("UPDATE funds SET currency = 'CNY' WHERE currency IS NULL")
    
    conn.commit()
    conn.close()
    
    print("✅ Migration completed successfully!")
    print("   - Added currency column (VARCHAR(3))")
    print("   - Set default value 'CNY' for all existing funds")


if __name__ == "__main__":
    migrate()
