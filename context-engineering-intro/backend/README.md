# Senova CRM - Backend

Enterprise-grade CRM platform with unified communications and multi-gateway payments.

## Stack

- **Framework**: FastAPI 0.115.0 (async/await)
- **Database**: PostgreSQL with asyncpg driver
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Authentication**: JWT with Argon2 password hashing
- **Task Queue**: Celery + Redis
- **Testing**: Pytest with async support

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   └── auth.py          # Authentication endpoints
│   │   └── dependencies.py      # Shared dependencies (auth, db)
│   ├── config/
│   │   ├── settings.py          # Pydantic Settings
│   │   └── database.py          # Async database config
│   ├── core/
│   │   ├── security.py          # JWT + password hashing
│   │   ├── exceptions.py        # Custom exceptions
│   │   └── middleware.py        # CORS, rate limiting, logging
│   ├── models/
│   │   ├── user.py              # User/staff accounts
│   │   ├── contact.py           # CRM contacts
│   │   ├── communication.py     # Unified inbox (SMS, email, chat, phone)
│   │   ├── payment.py           # Payment transactions (PCI compliant)
│   │   ├── workflow.py          # Automation workflows
│   │   ├── integration.py       # API credentials (encrypted)
│   │   └── pipeline.py          # Sales/marketing pipelines
│   ├── schemas/
│   │   ├── user.py              # Pydantic schemas for users
│   │   ├── contact.py           # Pydantic schemas for contacts
│   │   ├── communication.py     # Pydantic schemas for communications
│   │   └── payment.py           # Pydantic schemas for payments
│   ├── services/                # Business logic (to be implemented)
│   ├── tasks/                   # Celery tasks (to be implemented)
│   ├── utils/                   # Utility functions
│   └── main.py                  # FastAPI application
├── alembic/
│   ├── versions/                # Migration files
│   └── env.py                   # Alembic environment
├── tests/
│   ├── conftest.py              # Pytest fixtures
│   └── test_auth.py             # Authentication tests
├── requirements.txt             # Python dependencies
├── pytest.ini                   # Pytest configuration
├── alembic.ini                  # Alembic configuration
└── .env.example                 # Environment variables template

```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required environment variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret (generate with `openssl rand -hex 32`)
- Payment gateway API keys (Stripe, Square, PayPal, Cash App)
- Communication service keys (Bandwidth.com, Mailgun)
- AI service keys (Closebot, AudienceLab)

### 3. Initialize Database

```bash
# Create database
createdb senova_crm

# Run migrations
alembic upgrade head
```

### 4. Run Development Server

```bash
# Using uvicorn directly
uvicorn app.main:app --reload --port 8000

# Or using Python
python -m app.main
```

API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run only auth tests
pytest -m auth -v
```

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (invalidate refresh token)
- `GET /api/v1/auth/me` - Get current user info

### Health

- `GET /health` - Health check endpoint
- `GET /` - API information

## Development

### Code Quality

```bash
# Format code
black app/

# Lint code
ruff check app/ --fix

# Type checking
mypy app/
```

### Database

The application uses PostgreSQL with async SQLAlchemy. All database operations are async using `async/await`.

**Key models:**
- **User**: Staff accounts with role-based permissions
- **Contact**: CRM contacts with JSONB custom fields
- **Communication**: Unified inbox for SMS, email, phone, web chat
- **Payment**: PCI DSS compliant (tokenized only, no raw card data)
- **Workflow**: Automation workflows with triggers and actions
- **Integration**: Encrypted API credentials storage
- **Pipeline**: Sales/marketing funnel definitions

### Security

- **Password Hashing**: Argon2 (via pwdlib)
- **JWT Tokens**: Access tokens (30min) + Refresh tokens (7 days)
- **CORS**: Configured for frontend origins
- **Rate Limiting**: 100 requests/minute per IP
- **PCI DSS Compliance**: NO raw card data storage, tokenization only

## Next Steps

**Phase 2: Communication Services** (To be implemented)
- Bandwidth.com SMS/MMS/Voice integration
- Mailgun email service
- WebSocket for web chat
- Celery tasks for async messaging

**Phase 3: Payment Gateways** (To be implemented)
- Stripe payment service
- Square payment service
- PayPal integration
- Cash App Pay integration
- Multi-gateway routing

**Phase 4: AI & Automation** (To be implemented)
- Closebot AI integration
- AudienceLab enrichment
- Workflow automation engine

**Phase 5: Frontend** (To be implemented)
- React/Next.js dashboard
- Unified inbox UI
- Contact management
- Payment processing UI

## Documentation

- Full API docs: `/docs` (Swagger UI)
- Alternative docs: `/redoc` (ReDoc)
- PRP: `../PRPs/eve-beauty-ma-crm.md`
- Research: `../research/` directory

## Contributing

Follow the coding standards in `../CLAUDE.md`:
- Use async/await throughout
- Type hints on all functions
- Pydantic for validation
- Comprehensive error handling
- 80%+ test coverage

## License

Proprietary - Eve Beauty MA / Noveris Data, LLC
