from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import random
import enum


class DeliveryStatus(str, enum.Enum):
    STARTED = "started"
    EN_ROUTE = "en_route"
    COMPLETED = "completed"

@dataclass
class PacketDelivery:
    """Represents a packet delivery with location tracking."""
    device_id: str
    vehicle_id: str
    session_id: str
    order_id: str
    
    def __post_init__(self):
        # Initialize with random coordinates in NYC area
        self.start_lat = 40.7 + random.uniform(-0.1, 0.1)
        self.start_lon = -74.0 + random.uniform(-0.1, 0.1)
        self.end_lat = 40.7 + random.uniform(-0.1, 0.1)
        self.end_lon = -74.0 + random.uniform(-0.1, 0.1)
        
        # Current position starts at the starting location
        self.current_lat = self.start_lat
        self.current_lon = self.start_lon
        
        # Set initial status
        self.status = DeliveryStatus.STARTED
        
        # Set movement parameters
        self.speed = random.uniform(0.0001, 0.0005)  # degrees per update
        self.progress = 0.0  # 0.0 to 1.0
        
    def update_position(self, speed: Optional[float] = None):
        """Update the current position based on progress towards destination.

        Parameters
        ----------
        speed: Optional[float]
            If provided, use this value instead of the delivery's own ``self.speed``.  This
            allows an external controller (e.g. the Simulator) to accelerate or slow down
            all deliveries uniformly without modifying each object individually.
        """
        if self.progress >= 1.0:
            # Already at destination
            return

        # Use the override speed if supplied, otherwise fall back to the object's speed
        increment = speed if speed is not None else self.speed

        # Increment progress towards completion
        self.progress += increment
        if self.progress > 1.0:
            self.progress = 1.0

        # Update current geographic position (simple linear interpolation)
        self.current_lat = self.start_lat + (self.end_lat - self.start_lat) * self.progress
        self.current_lon = self.start_lon + (self.end_lon - self.start_lon) * self.progress
    
    def is_completed(self) -> bool:
        """Check if the delivery has reached its destination."""
        return self.progress >= 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the delivery to a dictionary for serialization."""
        return {
            "device_id": self.device_id,
            "vehicle_id": self.vehicle_id,
            "session_id": self.session_id,
            "order_id": self.order_id,
            "status": self.status,
            "timestamp": datetime.utcnow().isoformat(),
            "start_lat": self.start_lat,
            "start_lon": self.start_lon,
            "end_lat": self.end_lat,
            "end_lon": self.end_lon,
            "current_lat": self.current_lat,
            "current_lon": self.current_lon
        } 
