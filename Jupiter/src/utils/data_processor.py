from typing import Dict, Any, Tuple
import logging
import json
import uuid


logger = logging.getLogger(__name__)


class DataProcessor:
    """Handles data processing and transformation for session data"""
    
    @staticmethod
    def parse_kafka_message(record: str) -> Dict[str, Any]:
        """Parse raw Kafka message into dictionary"""
        try:
            return json.loads(record) if isinstance(record, str) else record
        except Exception as e:
            logger.error(f"Failed to parse Kafka message: {e}")
            return {}
    
    @staticmethod
    def format_timestamp(timestamp_iso: str) -> str:
        """Convert ISO timestamp to ClickHouse format"""
        # e.g. "2025-07-21T18:30:15.734790" -> "2025-07-21 18:30:15.734"
        return timestamp_iso.replace('T', ' ')[:26]
    
    @staticmethod
    def extract_session_data(data: Dict[str, Any]) -> Tuple[str, str, str, str, str]:
        """Extract key session data fields"""
        return (
            data.get('session_id', ''),
            data.get('vehicle_id', ''),
            data.get('order_id', ''),
            data.get('status', ''),
            data.get('timestamp', '')
        )
    
    @staticmethod
    def extract_location_data(data: Dict[str, Any]) -> Tuple[float, float, float, float, float, float]:
        """Extract location data fields"""
        return (
            float(data.get('start_lat', 0)),
            float(data.get('start_lon', 0)),
            float(data.get('end_lat', 0)),
            float(data.get('end_lon', 0)),
            float(data.get('current_lat', 0)),
            float(data.get('current_lon', 0))
        )
    
    @staticmethod
    def create_vehicle_row(vehicle_id: str, first_seen: str) -> Tuple[Any, ...]:
        """Create row data for vehicles table"""
        return (vehicle_id, DataProcessor.format_timestamp(first_seen))
    
    @staticmethod
    def create_session_row(session_id: str, vehicle_id: str, order_id: str, 
                          timestamp: str, start_lat: float, start_lon: float,
                          end_lat: float, end_lon: float) -> Tuple[Any, ...]:
        """Create row data for sessions table"""
        return (
            session_id,
            vehicle_id,
            order_id,
            DataProcessor.format_timestamp(timestamp),
            start_lat,
            start_lon,
            end_lat,
            end_lon
        )
    
    @staticmethod
    def create_order_row(order_id: str, status: str, completed_at: str) -> Tuple[Any, ...]:
        """Create row data for orders table (completed orders only)"""
        return (
            order_id,
            status,
            DataProcessor.format_timestamp(completed_at)
        )
    
    @staticmethod
    def create_movement_row(session_id: str, status: str, timestamp: str, 
                           current_lat: float, current_lon: float) -> Tuple[Any, ...]:
        """Create row data for session_movements table"""
        return (
            str(uuid.uuid4()),  # Generate UUID for the movement record
            session_id,
            status,
            DataProcessor.format_timestamp(timestamp),
            current_lon,
            current_lat
        ) 