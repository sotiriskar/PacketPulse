from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.serialization import SimpleStringSchema
from pyflink.datastream.connectors import FlinkKafkaConsumer
from src.utils.clickhouse import ClickHouseManager
from src.utils.sink import ClickHouseSink
from src.config.settings import (
    KAFKA_BOOTSTRAP, KAFKA_TOPIC, KAFKA_CONSUMER_GROUP,
    FLINK_PARALLELISM, FLINK_JOB_NAME, LOG_LEVEL, LOG_FORMAT
)
import logging

logger = logging.getLogger(__name__)


class JupiterService:
    """Main Jupiter service that orchestrates the Flink job and ClickHouse operations"""
    
    def __init__(self):
        self.clickhouse_manager = ClickHouseManager()
        self.env = None
        self.kafka_consumer = None
        self.stream = None
    
    def setup_logging(self):
        """Configure logging for the service"""
        logging.basicConfig(
            level=LOG_LEVEL,
            format=LOG_FORMAT
        )
        logger.info("🚀 Starting Jupiter service...")
    
    def ensure_clickhouse_tables(self):
        """Ensure ClickHouse tables are created before starting Flink"""
        logger.info("🔧 Ensuring ClickHouse tables exist...")
        if not self.clickhouse_manager.ensure_tables():
            raise RuntimeError("Failed to create ClickHouse tables")
        logger.info("✅ ClickHouse tables ready")
    
    def setup_flink_environment(self):
        """Set up the Flink execution environment"""
        logger.info("🔧 Setting up Flink environment...")
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.env.set_parallelism(FLINK_PARALLELISM)
        logger.info(f"✅ Flink environment configured with parallelism {FLINK_PARALLELISM}")
    
    def setup_kafka_consumer(self):
        """Set up the Kafka consumer for Flink"""
        logger.info("🔧 Creating Kafka consumer...")
        self.kafka_consumer = FlinkKafkaConsumer(
            topics=KAFKA_TOPIC,
            deserialization_schema=SimpleStringSchema(),
            properties={
                'bootstrap.servers': KAFKA_BOOTSTRAP,
                'group.id': KAFKA_CONSUMER_GROUP
            }
        )
        logger.info(f"✅ Kafka consumer configured for topic: {KAFKA_TOPIC}")
    
    def setup_data_stream(self):
        """Set up the Flink data stream with the ClickHouse sink"""
        logger.info("🔧 Setting up data stream...")
        self.stream = self.env.add_source(self.kafka_consumer)
        self.stream.map(ClickHouseSink()).name("clickhouse-sink")
        logger.info("✅ Data stream configured with ClickHouse sink")
    
    def start(self):
        """Start the Jupiter service"""
        try:
            # Setup logging
            self.setup_logging()
            
            # Ensure ClickHouse tables exist
            self.ensure_clickhouse_tables()
            
            # Setup Flink environment
            self.setup_flink_environment()
            
            # Setup Kafka consumer
            self.setup_kafka_consumer()
            
            # Setup data stream
            self.setup_data_stream()
            
            # Execute the Flink job
            logger.info(f"🚀 Launching Flink job ({FLINK_JOB_NAME})...")
            self.env.execute(FLINK_JOB_NAME)
            
        except Exception as e:
            logger.error(f"❌ Failed to start Jupiter service: {e}")
            raise
    
    def stop(self):
        """Stop the Jupiter service"""
        logger.info("🛑 Stopping Jupiter service...")
        if self.clickhouse_manager:
            self.clickhouse_manager.close()
        logger.info("✅ Jupiter service stopped")


def main():
    """Main entry point for the Jupiter service"""
    service = JupiterService()
    
    try:
        service.start()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error(f"Service failed: {e}")
        raise
    finally:
        service.stop()


if __name__ == "__main__":
    main() 