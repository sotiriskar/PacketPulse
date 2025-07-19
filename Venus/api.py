from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from Venus.utils import KafkaProducer, ConnectionManager
from fastapi.middleware.cors import CORSMiddleware
from Venus.models import DeliveryData
import uvicorn
import logging
import json
import os


# Configure logging
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Venus API", description="WebSocket API for packet delivery data")

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

# Initialize connection manager
connection_manager = ConnectionManager()

# Initialize Kafka producer
kafka_producer = KafkaProducer()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await kafka_producer.start()
    logger.info("Venus API started")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    await kafka_producer.stop()
    logger.info("Venus API shutdown")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    # Accept the connection
    await connection_manager.connect(websocket)
    client_id = f"client_{len(connection_manager.active_connections)}"
    
    try:
        # Wait for authentication message
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)
        
        # Check for authentication type message
        if auth_data.get("type") == "authentication" and auth_data.get("api_key") == API_KEY:
            # Send authentication success response
            await websocket.send_json({"status": "authenticated", "message": "Authentication successful"})
            
            # Process messages
            while True:
                # Receive and parse data
                data = await websocket.receive_text()
                delivery_data = json.loads(data)
                
                # Validate and process data
                try:
                    # Create DeliveryData model instance
                    delivery = DeliveryData(**delivery_data)
                    
                    # Send to Kafka
                    await kafka_producer.send_message("sessions", delivery.dict())
                    
                    # Log the received data
                    logger.info(f"Processed delivery data for device {delivery.device_id}, status: {delivery.status}")
                    
                    # Send acknowledgment
                    await websocket.send_json({"success": True, "message": "Data received"})
                    
                except Exception as e:
                    logger.error(f"Error processing data: {e}")
                    await websocket.send_json({"success": False, "message": str(e)})
        else:
            # Authentication failed
            await websocket.send_json({"status": "error", "message": "Authentication failed"})
            await connection_manager.disconnect(websocket)
            
    except WebSocketDisconnect:
        # Handle client disconnect
        await connection_manager.disconnect(websocket)
        logger.info(f"Client disconnected: {client_id}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Venus API"}

def start():
    """Start the API server"""
    uvicorn.run(
        "Venus.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1
    )

if __name__ == "__main__":
    start() 