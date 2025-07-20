import json
import logging
from confluent_kafka import Consumer, KafkaError
from pydantic import ValidationError
from src.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC,
    KAFKA_CONSUMER_GROUP
)
from src.models.delivery import DeliveryData, DeliveryStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_consumer():
    """Create and configure the Kafka consumer."""
    config = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': KAFKA_CONSUMER_GROUP,
        'auto.offset.reset': 'earliest'
    }
    return Consumer(config)

def process_message(msg):
    """Process and validate the received delivery data."""
    try:
        # Decode message value
        raw_data = json.loads(msg.value().decode('utf-8'))
        
        # Validate message against our model
        delivery = DeliveryData(**raw_data)
        
        # Log the validated delivery data
        logger.info("Received valid delivery data:")
        logger.info(f"Order ID: {delivery.order_id}")
        logger.info(f"Session ID: {delivery.session_id}")
        logger.info(f"Status: {delivery.status}")
        logger.info(f"Vehicle ID: {delivery.vehicle_id}")
        logger.info(f"Device ID: {delivery.device_id}")
        logger.info("Location Info:")
        logger.info(f"  Start: ({delivery.start_lat}, {delivery.start_lon})")
        logger.info(f"  End: ({delivery.end_lat}, {delivery.end_lon})")
        logger.info(f"  Current: ({delivery.current_lat}, {delivery.current_lon})")
        logger.info(f"Timestamp: {delivery.timestamp}")
        logger.info("-" * 50)
        
    except json.JSONDecodeError as e:
        logger.warning(f"Skipping invalid JSON message: {e}")
    except ValidationError as e:
        logger.warning(f"Skipping message - validation failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error processing message: {e}")

def main():
    """Main function to consume and validate delivery data."""
    consumer = create_consumer()
    consumer.subscribe([KAFKA_TOPIC])
    
    logger.info(f"Started consuming delivery data from topic: {KAFKA_TOPIC}")
    logger.info("Validating messages against DeliveryData schema")
    
    try:
        while True:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    logger.info("Reached end of partition")
                else:
                    logger.error(f"Error: {msg.error()}")
            else:
                process_message(msg)
                
    except KeyboardInterrupt:
        logger.info("Shutting down consumer...")
    finally:
        consumer.close()

if __name__ == "__main__":
    main()
