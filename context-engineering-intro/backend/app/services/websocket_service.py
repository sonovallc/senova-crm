"""
WebSocket service for real-time web chat

Features:
- Real-time message delivery
- Connection management
- Presence indicators
- Typing indicators
- Message threading
"""

from typing import Dict, Set, List, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
import json
import asyncio
from uuid import UUID

from app.core.exceptions import IntegrationError


class ConnectionManager:
    """
    Manages WebSocket connections for web chat

    Features:
    - Connection pooling by user ID
    - Broadcast to specific users
    - Presence tracking
    - Typing indicators
    """

    def __init__(self):
        # Active connections: {user_id: {websocket1, websocket2, ...}}
        self.active_connections: Dict[str, Set[WebSocket]] = {}

        # User presence: {user_id: {"status": "online", "last_seen": datetime}}
        self.presence: Dict[str, Dict] = {}

        # Typing indicators: {contact_id: {user_id1, user_id2, ...}}
        self.typing_users: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """
        Accept WebSocket connection and register user

        Args:
            websocket: WebSocket connection
            user_id: User ID string
        """
        await websocket.accept()

        # Add connection to pool
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        self.active_connections[user_id].add(websocket)

        # Update presence
        self.presence[user_id] = {
            "status": "online",
            "last_seen": datetime.now(timezone.utc),
        }

        # Broadcast presence update
        await self.broadcast_presence_update(user_id, "online")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """
        Remove WebSocket connection and update presence

        Args:
            websocket: WebSocket connection
            user_id: User ID string
        """
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            # If no more connections, mark as offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

                self.presence[user_id] = {
                    "status": "offline",
                    "last_seen": datetime.now(timezone.utc),
                }

                # Broadcast presence update (async, run in background)
                asyncio.create_task(
                    self.broadcast_presence_update(user_id, "offline")
                )

    async def send_personal_message(self, message: Dict, user_id: str):
        """
        Send message to specific user (all their connections)

        Args:
            message: Message data dict
            user_id: Target user ID
        """
        if user_id in self.active_connections:
            # Send to all user's connections (multiple devices)
            dead_connections = set()

            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Connection dead, mark for removal
                    dead_connections.add(connection)

            # Clean up dead connections
            for dead_conn in dead_connections:
                self.active_connections[user_id].discard(dead_conn)

    async def send_contact_message(
        self,
        message: Dict,
        contact_id: str,
        exclude_user_id: Optional[str] = None,
    ):
        """
        Send message to specific contact

        For widget connections, contact_id IS the user_id.
        This ensures messages are sent ONLY to the intended recipient.

        Args:
            message: Message data dict
            contact_id: Contact ID (this IS the user_id for widget connections)
            exclude_user_id: User ID to exclude (not used for contact messages)
        """
        # Send message ONLY to the specific contact
        # For widget connections, contact_id IS the user_id
        await self.send_personal_message(message, contact_id)

    async def broadcast_presence_update(self, user_id: str, status: str):
        """
        Broadcast user presence update to all connected users

        Args:
            user_id: User whose presence changed
            status: New status ("online" or "offline")
        """
        message = {
            "type": "presence_update",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Broadcast to all users except the one who changed
        for uid in list(self.active_connections.keys()):
            if uid != user_id:
                await self.send_personal_message(message, uid)

    async def set_typing_indicator(
        self,
        user_id: str,
        contact_id: str,
        is_typing: bool,
    ):
        """
        Set/unset typing indicator for a conversation

        Args:
            user_id: User who is typing
            contact_id: Contact ID for the conversation
            is_typing: True if typing, False if stopped
        """
        if is_typing:
            # Add user to typing set
            if contact_id not in self.typing_users:
                self.typing_users[contact_id] = set()
            self.typing_users[contact_id].add(user_id)
        else:
            # Remove user from typing set
            if contact_id in self.typing_users:
                self.typing_users[contact_id].discard(user_id)
                if not self.typing_users[contact_id]:
                    del self.typing_users[contact_id]

        # Broadcast typing indicator update
        message = {
            "type": "typing_indicator",
            "user_id": user_id,
            "contact_id": contact_id,
            "is_typing": is_typing,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Send to all users assigned to this contact (except the typer)
        await self.send_contact_message(message, contact_id, exclude_user_id=user_id)

    def get_online_users(self) -> List[str]:
        """
        Get list of currently online user IDs

        Returns:
            List of user ID strings
        """
        return list(self.active_connections.keys())

    def is_user_online(self, user_id: str) -> bool:
        """
        Check if user is currently online

        Args:
            user_id: User ID to check

        Returns:
            True if user has active connections
        """
        return user_id in self.active_connections and bool(
            self.active_connections[user_id]
        )

    def get_typing_users(self, contact_id: str) -> List[str]:
        """
        Get users currently typing in a conversation

        Args:
            contact_id: Contact ID

        Returns:
            List of user ID strings
        """
        return list(self.typing_users.get(contact_id, set()))

    async def broadcast_to_staff(self, message: Dict):
        """
        Broadcast message to all connected staff members

        Args:
            message: Message data dict
        """
        # Broadcast to all connected users (staff members)
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)


# Global connection manager instance
connection_manager = ConnectionManager()


def get_connection_manager() -> ConnectionManager:
    """Get global connection manager instance"""
    return connection_manager
