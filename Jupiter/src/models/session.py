from pydantic import BaseModel, ConfigDict


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


class SessionBase(BaseModel):
    """Model for session base data (immutable session header)"""
    session_id: str
    vehicle_id: str
    order_id: str
    event_started: str  # DateTime64(3) format
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float


class SessionEvent(BaseModel):
    """Model for session event data (status changes)"""
    session_id: str
    event_time: str  # DateTime64(3) format
    status: str


class SessionMovement(BaseModel):
    """Model for session movement data (GPS pings)"""
    session_id: str
    vehicle_id: str
    order_id: str
    status: str
    event_time: str  # DateTime64(3) format
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    current_lat: float
    current_lon: float 