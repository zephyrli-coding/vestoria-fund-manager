"""
Migration script: Add tags column to funds table
Run this to migrate existing database to support tags field
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'fund_manager.db')


def migrate():
    """Add tags column and set default value for existing funds."""
    print(f"Migrating database: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if tags column already exists
    cursor.execute("PRAGMA table_info(funds)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'tags' in columns:
        print("✅ Tags column already exists, skipping migration")
        conn.close()
        return
    
    # Add tags column
    print("Adding tags column...")
    cursor.execute("ALTER TABLE funds ADD COLUMN tags VARCHAR(500) DEFAULT ''")
    
    # Update existing funds to have tags = ''
    print("Setting default tags for existing funds...")
    cursor.execute("UPDATE funds SET tags = '' WHERE tags IS NULL")
    
    conn.commit()
    conn.close()
    
    print("✅ Migration completed successfully!")
    print("   - Added tags column (VARCHAR(500))")
    print("   - Set default value '' for all existing funds")


if __name__ == "__main__":
    migrate()
