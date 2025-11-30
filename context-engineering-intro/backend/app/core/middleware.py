"""Custom middleware for rate limiting, logging, and security headers"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from typing import Callable
import time
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware

    TODO: For production, use Redis-based rate limiting for distributed systems
    This is a basic in-memory implementation for development
    """

    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients = {}

    async def dispatch(self, request: Request, call_next: Callable):
        """Process request with rate limiting"""
        client = request.client.host if request.client else "unknown"

        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        now = time.time()

        # Clean up old entries
        self.clients = {
            k: v for k, v in self.clients.items()
            if now - v["reset_time"] < self.period
        }

        # Check rate limit
        if client in self.clients:
            client_data = self.clients[client]
            if now - client_data["reset_time"] < self.period:
                if client_data["calls"] >= self.calls:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={"detail": "Too many requests. Please try again later."}
                    )
                client_data["calls"] += 1
            else:
                self.clients[client] = {"calls": 1, "reset_time": now}
        else:
            self.clients[client] = {"calls": 1, "reset_time": now}

        response = await call_next(request)
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses"""

    async def dispatch(self, request: Request, call_next: Callable):
        """Log request and response details"""
        start_time = time.time()

        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")

        response = await call_next(request)

        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} "
            f"({process_time:.3f}s) - {request.method} {request.url.path}"
        )

        # Add process time header
        response.headers["X-Process-Time"] = str(process_time)

        return response


def add_security_headers(response):
    """Add security headers to response"""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
