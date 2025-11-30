"""Custom exception classes for the application"""


class EveBeautyMAException(Exception):
    """Base exception for Senova CRM"""

    pass


class AuthenticationError(EveBeautyMAException):
    """Raised when authentication fails"""

    pass


class AuthorizationError(EveBeautyMAException):
    """Raised when user lacks required permissions"""

    pass


class PermissionDeniedError(AuthorizationError):
    """Raised when user is denied access to a specific resource or action"""

    pass


class NotFoundError(EveBeautyMAException):
    """Raised when requested resource not found"""

    pass


class ValidationError(EveBeautyMAException):
    """Raised when data validation fails"""

    pass


class IntegrationError(EveBeautyMAException):
    """Raised when third-party integration fails"""

    pass


class PaymentError(EveBeautyMAException):
    """Raised when payment processing fails"""

    pass
