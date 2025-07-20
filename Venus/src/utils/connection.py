from fastapi import WebSocket
from typing import List
import asyncio
import logging
import os


# Configure logging
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_lock = asyncio.Lock()
        self.max_connections = int(os.environ.get("MAX_CONNECTIONS", "100"))
        self.connection_semaphore = asyncio.Semaphore(self.max_connections)
    
    async def connect(self, websocket: WebSocket):
        """Connect a new WebSocket client"""
        async with self.connection_semaphore:
            await websocket.accept()
            async with self.connection_lock:
                self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client"""
        async with self.connection_lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients"""
        for connection in self.active_connections:
            await connection.send_text(message)
