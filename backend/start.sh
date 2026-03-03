#!/bin/bash
# Quick start script for Fund Manager Backend (using uv)

set -e

echo "🚀 Starting Fund Manager Backend (with uv)..."
echo ""

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment with uv..."
    uv venv
fi

# Install/update dependencies
echo "📚 Installing dependencies with uv..."
uv pip install -q -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
source .venv/bin/activate
python init_db.py

# Start server
echo ""
echo "✅ Starting FastAPI server..."
echo "📖 API docs: http://localhost:8000/docs"
echo "🔐 Default login: admin / [REDACTED_TEST_PASSWORD]"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
