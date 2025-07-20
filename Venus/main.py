from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.utils.connection import ConnectionManager
from src.models.delivery import DeliveryData
from src.utils.kafka import KafkaProducer
import uvicorn
import logging
import json
import os

# Configure logging
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize connection & Kafka producer
connection_manager = ConnectionManager()
kafka_producer = KafkaProducer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle handler for startup and shutdown."""
    await kafka_producer.start()
    logger.info("Venus API started")
    yield
    await kafka_producer.stop()
    logger.info("Venus API shutdown")

app = FastAPI(
    title="Venus API",
    description="WebSocket API for packet delivery data",
    lifespan=lifespan,
    websocket_ping_interval=None  # Disable automatic ping/pong
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key for authentication
API_KEY = os.environ.get("API_KEY", "mars-secret-key")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    await connection_manager.connect(websocket)
    client_id = f"client_{len(connection_manager.active_connections)}"
    try:
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)
        if auth_data.get("type") == "authentication" and auth_data.get("api_key") == API_KEY:
            await websocket.send_json({"status": "authenticated", "message": "Authentication successful"})
            while True:
                data = await websocket.receive_text()
                delivery_data = json.loads(data)
                try:
                    delivery = DeliveryData(**delivery_data)
                    await kafka_producer.send_message("sessions", delivery.dict())
                    logger.info(f"Processed delivery data for device {delivery.device_id}, status: {delivery.status}")
                    await websocket.send_json({"success": True, "message": "Data received"})
                except Exception as e:
                    logger.error(f"Error processing data: {e}")
                    await websocket.send_json({"success": False, "message": str(e)})
        else:
            await websocket.send_json({"status": "error", "message": "Authentication failed"})
            await connection_manager.disconnect(websocket)
    except WebSocketDisconnect:
        await connection_manager.disconnect(websocket)
        logger.info(f"Client disconnected: {client_id}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Venus API"}

def start():
    """Start the API server"""
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        ws_ping_interval=None,  # Disable WebSocket ping/pong
        ws_ping_timeout=None,   # Disable ping timeout
        timeout_keep_alive=0    # Disable keep-alive timeout
    )

if __name__ == "__main__":
    start()
