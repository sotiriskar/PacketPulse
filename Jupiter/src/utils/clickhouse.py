from src.config.settings import (
    CLICKHOUSE_HOST, CLICKHOUSE_PORT, CLICKHOUSE_USER, CLICKHOUSE_DB,
    TAB_SESSIONS, TAB_ORDERS, TAB_MOVEMENTS, TAB_VEHICLES, MAX_RETRIES, RETRY_DELAY
)
from typing import List, Any, Tuple
import clickhouse_connect
import logging
import time


logger = logging.getLogger(__name__)


class ClickHouseManager:
    """Manages ClickHouse connections and operations"""
    
    def __init__(self):
        self.client = None
        self._ddl_statements = [
            # 1️⃣ vehicles table
            f"""
            CREATE TABLE IF NOT EXISTS {TAB_VEHICLES} (
              vehicle_id String,
              first_seen DateTime64(3)
            )
            ENGINE = MergeTree
            ORDER BY vehicle_id
            """,

            # 2️⃣ sessions table
            f"""
            CREATE TABLE IF NOT EXISTS {TAB_SESSIONS} (
              session_id    String,
              vehicle_id    String,
              order_id      String,
              event_started DateTime64(3),
              start_lat     Float64,
              start_lon     Float64,
              end_lat       Float64,
              end_lon       Float64
            )
            ENGINE = MergeTree
            PARTITION BY toYYYYMM(event_started)
            ORDER BY session_id
            """,

            # 3️⃣ orders table (completed orders only)
            f"""
            CREATE TABLE IF NOT EXISTS {TAB_ORDERS} (
              order_id     String,
              status       String,
              completed_at DateTime64(3)
            )
            ENGINE = MergeTree
            PARTITION BY toYYYYMM(completed_at)
            ORDER BY order_id
            """,

            # 4️⃣ session movements table
            f"""
            CREATE TABLE IF NOT EXISTS {TAB_MOVEMENTS} (
              id          UUID,
              session_id  String,
              status      String,
              event_tsp   DateTime64(3),
              current_lon Float64,
              current_lat Float64
            )
            ENGINE = MergeTree
            PARTITION BY toYYYYMM(event_tsp)
            ORDER BY (session_id, event_tsp)
            """
        ]
    
    def connect(self) -> bool:
        """Establish connection to ClickHouse"""
        try:
            self.client = clickhouse_connect.get_client(
                host=CLICKHOUSE_HOST,
                port=int(CLICKHOUSE_PORT),
                user=CLICKHOUSE_USER,
                database=CLICKHOUSE_DB
            )
            logger.info(f"Successfully connected to ClickHouse at {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to ClickHouse: {e}")
            return False
    
    def ensure_tables(self) -> bool:
        """Create all required tables if they don't exist"""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(f"[{attempt}/{MAX_RETRIES}] Attempting to connect to ClickHouse...")
                
                if not self.connect():
                    raise Exception("Connection failed")
                
                for i, ddl in enumerate(self._ddl_statements, 1):
                    logger.info(f"[{attempt}/{MAX_RETRIES}] Creating table {i}/3...")
                    self.client.command(ddl)
                    logger.info(f"[{attempt}/{MAX_RETRIES}] Table {i}/3 created successfully!")
                
                logger.info("✅ ClickHouse tables ready.")
                return True
                
            except Exception as exc:
                logger.error(f"[{attempt}/{MAX_RETRIES}] ClickHouse not ready – {exc}")
                if attempt < MAX_RETRIES:
                    logger.info(f"Waiting {RETRY_DELAY} seconds before retry...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("❌ Failed to create ClickHouse tables after all retries")
                    return False
    
    def insert_vehicles(self, data: List[Tuple[Any, ...]]) -> bool:
        """Insert vehicle data"""
        try:
            self.client.insert(TAB_VEHICLES, data)
            return True
        except Exception as e:
            logger.error(f"⚠️  vehicles insert failed: {e}")
            return False

    def insert_sessions(self, data: List[Tuple[Any, ...]]) -> bool:
        """Insert session data"""
        try:
            self.client.insert(TAB_SESSIONS, data)
            return True
        except Exception as e:
            logger.error(f"⚠️  sessions insert failed: {e}")
            return False
    
    def insert_orders(self, data: List[Tuple[Any, ...]]) -> bool:
        """Insert order data"""
        try:
            self.client.insert(TAB_ORDERS, data)
            return True
        except Exception as e:
            logger.error(f"⚠️  orders insert failed: {e}")
            return False
    
    def insert_session_movement(self, data: List[Tuple[Any, ...]]) -> bool:
        """Insert session movement data"""
        try:
            self.client.insert(TAB_MOVEMENTS, data)
            return True
        except Exception as e:
            logger.error(f"⚠️  session_movements insert failed: {e}")
            return False
    
    def close(self):
        """Close the ClickHouse connection"""
        if self.client:
            self.client.close()
            logger.info("ClickHouse connection closed") 