from pydantic import BaseModel, ConfigDict, Field
import enum
from typing import Optional


class DeliveryStatus(str, enum.Enum):
    """Status values for packet delivery"""
    STARTED = "started"
    EN_ROUTE = "en_route"
    COMPLETED = "completed"


class DeliveryData(BaseModel):
    """Model for packet delivery data received from Mars"""
    
    # Identifiers
    device_id: str = Field(..., min_length=1, description="Unique device identifier")
    vehicle_id: str = Field(..., min_length=1, description="Unique vehicle identifier")
    session_id: str = Field(..., min_length=1, description="Unique session identifier")
    order_id: str = Field(..., min_length=1, description="Unique order identifier")
    
    # Status information
    status: DeliveryStatus = Field(..., description="Current delivery status")
    timestamp: str = Field(..., min_length=1, description="ISO timestamp of the event")
    
    # Location information
    start_lat: float = Field(..., description="Starting latitude")
    start_lon: float = Field(..., description="Starting longitude")
    end_lat: float = Field(..., description="Ending latitude")
    end_lon: float = Field(..., description="Ending longitude")
    current_lat: float = Field(..., description="Current latitude")
    current_lon: float = Field(..., description="Current longitude")
    
    # Optional fields for additional context
    start_location: Optional[str] = Field(None, description="Human-readable start location")
    end_location: Optional[str] = Field(None, description="Human-readable end location")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "device_id": "74b21913-3c4f-450e-9263-b1570902d70c",
                "vehicle_id": "9b345a8e-2323-46f9-a00f-20e483027c85",
                "session_id": "e6f5714c-7020-4913-a26a-8ad13edf31d4",
                "order_id": "453c837d-a915-4488-90ee-8697109c0c4d",
                "status": "en_route",
                "timestamp": "2025-07-21T10:29:49.995290",
                "start_location": "origin",
                "end_location": "destination",
                "start_lat": 40.64130557523928,
                "start_lon": -74.05020129034969,
                "end_lat": 40.787517656998624,
                "end_lon": -74.0895188224741,
                "current_lat": 40.65007830014484,
                "current_lon": -74.05256034227716
            }
        }
    )


def validate_delivery_message(message_data: dict) -> DeliveryData:
    """
    Validate incoming delivery message data.
    
    Args:
        message_data (dict): Raw message data from Kafka
        
    Returns:
        DeliveryData: Validated delivery data object
        
    Raises:
        ValueError: If validation fails
    """
    try:
        return DeliveryData(**message_data)
    except Exception as e:
        raise ValueError(f"Message validation failed: {str(e)}")
 