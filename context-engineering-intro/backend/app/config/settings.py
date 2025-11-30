"""Application settings using Pydantic Settings for type-safe configuration"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Database
    database_url: str

    # JWT Authentication
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Application
    environment: str = "development"
    frontend_url: str = "http://localhost:3004"
    backend_url: str = "http://localhost:8000"
    allowed_origins: str = "http://localhost:3000,http://localhost:3004,http://127.0.0.1:3004,http://localhost:8000"

    # Bandwidth.com
    bandwidth_account_id: str = ""
    bandwidth_username: str = ""
    bandwidth_password: str = ""
    bandwidth_application_id: str = ""
    bandwidth_from_number: str = ""

    # Mailgun
    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    mailgun_from_email: str = ""
    mailgun_from_name: str = "Senova"
    mailgun_webhook_signing_key: str = ""

    # Stripe
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""

    # Square
    square_access_token: str = ""
    square_location_id: str = ""
    square_environment: str = "sandbox"

    # PayPal
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_mode: str = "sandbox"

    # Cash App
    cashapp_api_key: str = ""

    # AudienceLab
    audiencelab_api_key: str = ""

    # Closebot
    closebot_api_key: str = ""

    # Celery/Redis
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"

    # Cloudflare
    cloudflare_api_token: str = ""
    cloudflare_zone_id: str = ""

    # Hetzner
    hetzner_api_token: str = ""

    # Encryption
    encryption_key: str = ""

    # Cloudinary (File Storage)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment.lower() == "development"


# Global settings instance
settings = Settings()


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Using lru_cache ensures we only create one Settings instance
    and reuse it across the application lifecycle.

    Returns:
        Settings: Cached settings instance
    """
    return Settings()
