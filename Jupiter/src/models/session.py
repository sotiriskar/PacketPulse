from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid


class SessionData(BaseModel):
    """Model for session data received from Kafka"""
    
    # Identifiers
    session_id: str
    vehicle_id: str
    order_id: str
    
    # Status information
    status: str
    timestamp: str
    
    # Location information
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    current_lat: float
    current_lon: float
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f",
                "vehicle_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "order_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
                "status": "en_route",
                "timestamp": "2025-07-19T12:34:56.789Z",
                "start_lat": 40.7527,
                "start_lon": -73.9772,
                "end_lat": 40.7580,
                "end_lon": -73.9855,
                "current_lat": 40.7550,
                "current_lon": -73.9800
            }
        }
    )


class Vehicle(BaseModel):
    """Model for vehicle data"""
    vehicle_id: str
    first_seen: str  # DateTime64(3) format


class Session(BaseModel):
    """Model for session data (immutable session header)"""
    session_id: str
    vehicle_id: str
    order_id: str
    event_started: str  # DateTime64(3) format
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float


class Order(BaseModel):
    """Model for order data (completed orders only)"""
    order_id: str
    status: str
    completed_at: str  # DateTime64(3) format


class SessionMovement(BaseModel):
    """Model for session movement data (GPS pings)"""
    id: str = str(uuid.uuid4())  # Auto-generated UUID
    session_id: str
    status: str
    event_tsp: str  # DateTime64(3) format
    current_lon: float
    current_lat: float 