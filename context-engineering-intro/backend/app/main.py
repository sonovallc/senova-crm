"""
Senova CRM - FastAPI Application

Main application entry point with middleware, routers, and configuration
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from app.config.settings import settings
from app.config.database import init_db
from app.core.middleware import RateLimitMiddleware, LoggingMiddleware, add_security_headers
from app.api.v1 import auth, communications, webhooks, payments, ai, contacts, users, field_visibility, contacts_import, tags, activities, feature_flags, mailgun, inbox, email_templates, email_campaigns, autoresponders, suppressions, dashboard, objects

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.is_development else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events

    Runs on startup and shutdown
    """
    # Startup
    logger.info("Starting Senova CRM Application...")
    logger.info(f"Environment: {settings.environment}")

    # Initialize database (create tables if they don't exist)
    # In production, use Alembic migrations instead
    if settings.is_development:
        logger.info("Initializing database...")
        await init_db()

    logger.info("Application started successfully!")

    yield

    # Shutdown
    logger.info("Shutting down Senova CRM Application...")


# Create FastAPI application
app = FastAPI(
    title="Senova CRM API",
    description="Enterprise CRM platform with unified communications and multi-gateway payments",
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,  # Disable docs in production
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)


# Large Upload Middleware - Allow 100MB file uploads
class LargeUploadMiddleware(BaseHTTPMiddleware):
    """
    Middleware to increase max request body size to 100MB for large file uploads
    """
    async def dispatch(self, request: Request, call_next):
        # Set max upload size to 100MB (104857600 bytes)
        request.scope['extensions'] = request.scope.get('extensions') or {}
        request.scope['extensions']['http.request.body_max_size'] = 100 * 1024 * 1024
        response = await call_next(request)
        return response


app.add_middleware(LargeUploadMiddleware)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom Middleware
if not settings.is_development:
    # Rate limiting only in production (development can be annoying with rate limits)
    app.add_middleware(RateLimitMiddleware, calls=100, period=60)

app.add_middleware(LoggingMiddleware)


# Exception Handlers
from app.core.exceptions import NotFoundError, ValidationError, AuthenticationError, AuthorizationError


@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request: Request, exc: NotFoundError):
    """Handle NotFoundError - return 404"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)}
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle ValidationError - return 400"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )


@app.exception_handler(AuthenticationError)
async def authentication_exception_handler(request: Request, exc: AuthenticationError):
    """Handle AuthenticationError - return 401"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)}
    )


@app.exception_handler(AuthorizationError)
async def authorization_exception_handler(request: Request, exc: AuthorizationError):
    """Handle AuthorizationError - return 403"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error" if not settings.is_development else str(exc)
        }
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring

    Returns application status
    """
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "0.1.0"
    }


# Root Endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint

    Returns API information
    """
    return {
        "name": "Senova CRM API",
        "version": "0.1.0",
        "docs": "/docs" if settings.is_development else "disabled",
        "health": "/health"
    }


# Include API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(contacts_import.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(field_visibility.router, prefix="/api/v1")
app.include_router(communications.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
app.include_router(activities.router, prefix="/api/v1")
app.include_router(feature_flags.router, prefix="/api/v1")
app.include_router(mailgun.router, prefix="/api/v1")
app.include_router(inbox.router, prefix="/api/v1")
app.include_router(email_templates.router, prefix="/api/v1")
app.include_router(email_campaigns.router, prefix="/api/v1")
app.include_router(autoresponders.router, prefix="/api/v1")
app.include_router(suppressions.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(objects.router, prefix="/api/v1")


# Mount static files for uploaded content (development only)
# In production, use CDN or object storage directly
if settings.is_development:
    static_path = Path("/app/static")
    static_path.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
    logger.info(f"Static files mounted at /static (directory: {static_path})")


# Add security headers to all responses
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    return add_security_headers(response)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level="info" if settings.is_development else "warning"
    )
