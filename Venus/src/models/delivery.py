from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import datetime
import enum


class DeliveryStatus(str, enum.Enum):
    """Status values for packet delivery"""
    STARTED = "started"
    EN_ROUTE = "en_route"
    COMPLETED = "completed"


class DeliveryData(BaseModel):
    """Model for packet delivery data received from Mars"""
    
    # Identifiers
    device_id: str
    vehicle_id: str
    session_id: str
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
                "device_id": "d8f3b8e7-9c9d-4b5c-8e5f-1a2b3c4d5e6f",
                "vehicle_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "session_id": "f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f",
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


class DeliveryBatch(BaseModel):
    """Model for a batch of delivery data."""
    data: DeliveryData


class APIResponse(BaseModel):
    """Model for API responses."""
    success: bool
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())
    delivery_count: Optional[int] = None
    errors: Optional[List[str]] = None


class APIKeyData(BaseModel):
    """API key information."""
    api_key: str
    name: str
    created_at: str
    permissions: List[str] 
