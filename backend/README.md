# Fund Manager Backend

FastAPI backend for the fund management system.

## Setup

```bash
# Install dependencies using uv
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Initialize database
python init_db.py

# Migrate existing data (optional)
python migrate_data.py
```

## Run

```bash
# Development server
uvicorn app.main:app --reload

# Or use the start script
./start.sh
```

## Quick Start

```bash
cd backend
./start.sh
```

The start script will:
1. Create virtual environment with `uv venv` (if needed)
2. Install dependencies with `uv pip install`
3. Initialize database
4. Start the FastAPI server

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Default Admin

- Username: `admin`
- Password: `[REDACTED_TEST_PASSWORD]`

**⚠️ Change the default password in production!**

## Project Structure

```
backend/
├── app/
│   ├── api/           # API routes
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   ├── repositories/  # Data access layer
│   ├── main.py        # FastAPI app
│   ├── config.py      # Configuration
│   └── db.py          # Database connection
├── data/              # SQLite database
├── init_db.py         # Database initialization
├── migrate_data.py    # Data migration from pickle
├── requirements.txt   # Dependencies
├── pyproject.toml    # Project config
└── README.md         # This file
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Admin login
- `GET /api/v1/auth/me` - Get current admin info

### Funds
- `GET /api/v1/funds` - List all funds
- `POST /api/v1/funds` - Create fund
- `GET /api/v1/funds/{fund_id}` - Get fund details
- `PUT /api/v1/funds/{fund_id}` - Update fund
- `DELETE /api/v1/funds/{fund_id}` - Delete fund
- `POST /api/v1/funds/{fund_id}/update-nav` - Update NAV
- `GET /api/v1/funds/{fund_id}/history` - Get fund history
- `GET /api/v1/funds/{fund_id}/chart` - Get chart data

### Investors
- `GET /api/v1/funds/{fund_id}/investors` - List investors
- `POST /api/v1/funds/{fund_id}/investors` - Add investor
- `GET /api/v1/funds/{fund_id}/investors/{investor_id}` - Get investor details
- `PUT /api/v1/funds/{fund_id}/investors/{investor_id}` - Update investor
- `POST /api/v1/funds/{fund_id}/investors/{investor_id}/invest` - Invest
- `POST /api/v1/funds/{fund_id}/investors/{investor_id}/redeem` - Redeem
- `POST /api/v1/funds/{fund_id}/transfer` - Transfer shares
- `GET /api/v1/funds/{fund_id}/investors/operations` - Get operations
- `GET /api/v1/funds/{fund_id}/investors/{investor_id}/operations` - Get investor operations

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=sqlite:///./data/fund_manager.db
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_DAYS=7
```

## Troubleshooting

### uv command not found

If `which uv` returns nothing, but you installed it, try:

```bash
# Check if uv is in ~/.local/bin
~/.local/bin/uv --version

# If yes, add it to PATH temporarily
export PATH="$HOME/.local/bin:$PATH"

# Or permanently (add to ~/.bashrc)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```
