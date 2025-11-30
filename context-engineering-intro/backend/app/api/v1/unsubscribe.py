"""
Unsubscribe API Endpoints

Handles one-click unsubscribe (RFC 8058 compliance).
Provides both GET and POST endpoints for maximum compatibility.
"""

from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional

from app.api.dependencies import DatabaseSession
from app.services.unsubscribe_service import process_unsubscribe

router = APIRouter(prefix="/unsubscribe", tags=["Unsubscribe"])


# ==================== REQUEST/RESPONSE MODELS ====================


class UnsubscribeResponse(BaseModel):
    """Response for unsubscribe operation"""
    success: bool
    email: str
    contact_id: str
    contact_name: Optional[str] = None
    message: str


# ==================== ENDPOINTS ====================


@router.get("/{token}", response_class=HTMLResponse)
async def unsubscribe_get(
    token: str,
    db: DatabaseSession,
):
    """
    Unsubscribe via GET request (user clicks link in email).

    Args:
        token: Unsubscribe token from email

    Returns:
        HTML confirmation page
    """
    try:
        result = await process_unsubscribe(token, db)

        # Return HTML confirmation page
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed Successfully</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }}
                .container {{
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    text-align: center;
                }}
                .checkmark {{
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 2rem;
                    background: #10B981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .checkmark svg {{
                    width: 50px;
                    height: 50px;
                    stroke: white;
                    stroke-width: 3;
                    fill: none;
                }}
                h1 {{
                    color: #111827;
                    margin-bottom: 1rem;
                    font-size: 2rem;
                }}
                p {{
                    color: #6B7280;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }}
                .email {{
                    background: #F3F4F6;
                    padding: 0.75rem;
                    border-radius: 6px;
                    font-weight: 600;
                    color: #374151;
                    margin: 1.5rem 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">
                    <svg viewBox="0 0 52 52">
                        <polyline points="14 27 22 35 38 19"/>
                    </svg>
                </div>
                <h1>You've been unsubscribed</h1>
                <p>We've successfully removed your email address from our mailing list.</p>
                <div class="email">{result['email']}</div>
                <p>You will no longer receive marketing emails from Senova.</p>
                <p style="font-size: 0.875rem; color: #9CA3AF; margin-top: 2rem;">
                    If you believe this was a mistake, please contact our support team.
                </p>
            </div>
        </body>
        </html>
        """

        return HTMLResponse(content=html_content, status_code=200)

    except ValueError as e:
        # Invalid or already used token
        error_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribe Error</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }}
                .container {{
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    text-align: center;
                }}
                .error-icon {{
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 2rem;
                    background: #EF4444;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    color: white;
                }}
                h1 {{
                    color: #111827;
                    margin-bottom: 1rem;
                }}
                p {{
                    color: #6B7280;
                    line-height: 1.6;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">!</div>
                <h1>Unsubscribe Error</h1>
                <p>{str(e)}</p>
                <p style="font-size: 0.875rem; color: #9CA3AF; margin-top: 2rem;">
                    If you need assistance, please contact our support team.
                </p>
            </div>
        </body>
        </html>
        """

        return HTMLResponse(content=error_html, status_code=400)

    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process unsubscribe: {str(e)}"
        )


@router.post("/{token}", response_model=UnsubscribeResponse)
async def unsubscribe_post(
    token: str,
    request: Request,
    db: DatabaseSession,
):
    """
    Unsubscribe via POST request (one-click unsubscribe - RFC 8058).

    This endpoint supports the List-Unsubscribe-Post header for one-click unsubscribe.
    Email clients like Gmail can use this to unsubscribe users without requiring
    them to open a browser.

    Args:
        token: Unsubscribe token from email
        request: FastAPI request object

    Returns:
        JSON response with unsubscribe result
    """
    try:
        result = await process_unsubscribe(token, db)

        return UnsubscribeResponse(
            success=True,
            email=result['email'],
            contact_id=result['contact_id'],
            contact_name=result.get('contact_name'),
            message="Successfully unsubscribed from mailing list"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process unsubscribe: {str(e)}"
        )
