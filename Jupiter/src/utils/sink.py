from pyflink.datastream.functions import MapFunction
from src.utils.clickhouse import ClickHouseManager
from src.utils.data_processor import DataProcessor
import logging


logger = logging.getLogger(__name__)


class ClickHouseSink(MapFunction):
    """Flink MapFunction that processes Kafka messages and inserts into ClickHouse"""
    
    def __init__(self):
        self.clickhouse_manager = None
        self.seen_sessions = set()
    
    def open(self, runtime_context):
        """Initialize the sink when Flink starts the function"""
        logger.info("🔧 Initializing ClickHouse client...")
        self.clickhouse_manager = ClickHouseManager()
        
        # Connect to ClickHouse
        if not self.clickhouse_manager.connect():
            raise RuntimeError("Failed to connect to ClickHouse")
        
        logger.info("✅ ClickHouse client initialized")
    
    def map(self, record):
        """Process each Kafka message and insert into ClickHouse tables"""
        # Parse the Kafka message
        data = DataProcessor.parse_kafka_message(record)
        if not data:
            logger.warning("Skipping invalid message")
            return record
        
        # Extract session data
        session_id, vehicle_id, order_id, status, timestamp = DataProcessor.extract_session_data(data)
        start_lat, start_lon, end_lat, end_lon, current_lat, current_lon = DataProcessor.extract_location_data(data)
        
        # ------------------------------------------------------------------
        # 1️⃣  vehicles (every message with vehicle_id)
        # ------------------------------------------------------------------
        if vehicle_id:
            vehicle_row = [DataProcessor.create_vehicle_row(vehicle_id, timestamp)]
            self.clickhouse_manager.insert_vehicles(vehicle_row)
        
        # ------------------------------------------------------------------
        # 2️⃣  sessions (first message only, usually status='started')
        # ------------------------------------------------------------------
        if session_id and session_id not in self.seen_sessions and status == 'started':
            session_row = [DataProcessor.create_session_row(
                session_id, vehicle_id, order_id, timestamp, start_lat, start_lon, end_lat, end_lon
            )]
            
            if self.clickhouse_manager.insert_sessions(session_row):
                self.seen_sessions.add(session_id)
                logger.info(f"➕ sessions row inserted for {session_id}")
        
        # ------------------------------------------------------------------
        # 3️⃣  orders (only when completed)
        # ------------------------------------------------------------------
        if order_id and status in ['delivered', 'completed', 'finished']:
            order_row = [DataProcessor.create_order_row(order_id, status, timestamp)]
            self.clickhouse_manager.insert_orders(order_row)
        
        # ------------------------------------------------------------------
        # 4️⃣  session_movements (every message)
        # ------------------------------------------------------------------
        movement_row = [DataProcessor.create_movement_row(
            session_id, status, timestamp, current_lat, current_lon
        )]
        self.clickhouse_manager.insert_session_movement(movement_row)
        
        # Pass the record downstream if needed
        return record
    
    def close(self):
        """Clean up resources when Flink stops the function"""
        if self.clickhouse_manager:
            self.clickhouse_manager.close()
            logger.info("ClickHouse sink closed") 