from src.models.delivery import validate_delivery_message
from src.utils.iceberg import initialize_iceberg_table
from confluent_kafka import Consumer
from src.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_CONSUMER_GROUP,
    ICEBERG_TABLE,
    KAFKA_TOPIC
)
import pyarrow as pa
import pandas as pd
import logging
import json

logger = logging.getLogger("main")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
import warnings
warnings.filterwarnings(
    "ignore",
    message="Falling back to pure Python Avro decoder, missing Cython implementation"
)

class KafkaConsumer:

    def __init__(self) -> None:
        self.config = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'group.id': KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest'
        }
        self.consumer = Consumer(self.config)
        self.topic = KAFKA_TOPIC
        self.table = None

    def initialize_iceberg_table(self) -> None:
        """Initialize the Iceberg table once when the consumer starts"""
        try:
            self.table = initialize_iceberg_table()
        except Exception as e:
            logger.error(f"Error initializing Iceberg table: {e}")
            raise

    def consume_messages(self) -> None:
        """Subscribe to the Kafka topic and process the incoming messages"""
        # Initialize the Iceberg table once before starting to consume
        self.initialize_iceberg_table()
        
        self.consumer.subscribe([self.topic])
        try:
            logger.info("Consumer running...")
            while True:
                msg = self.consumer.poll(1.0)
                if msg is None:
                    continue
                elif msg.error():
                    logger.error("ERROR: {}".format(msg.error()))
                else:
                    self.process_message(msg)
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Error in consume_messages: {e}")
        finally:
            self.shutdown()

    def process_message(self, msg: object) -> None:
        """
        Process the incoming message and convert it to a PyArrow table.

        Args:
            msg (object): The incoming message
        """
        try:
            message = json.loads(msg.value().decode('utf-8'))

            # Validate the message using the delivery model
            try:
                validated_data = validate_delivery_message(message)
            except ValueError as e:
                logger.error(f"Message validation failed: {e}")
                return
            
            # Convert validated data to DataFrame
            pandas_df = pd.DataFrame([validated_data.model_dump()])

            # Ensure timestamp is string format for Iceberg compatibility
            pandas_df['timestamp'] = pandas_df['timestamp'].astype(str)
            pyarrow_df = pa.Table.from_pandas(pandas_df)
            self.process_iceberg(pyarrow_df)
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def process_iceberg(self, pyarrow_df: pa.Table) -> None:
        """
        Process the PyArrow table and append the data to the Iceberg table.

        Args:
            pyarrow_df (pa.Table): The PyArrow table
        """
        try:
            # The table is now initialized in initialize_iceberg_table, so we can just append
            self.table.append(pyarrow_df)
            logger.info(f"📦 Uploaded session {pyarrow_df['session_id'][0]} to table {ICEBERG_TABLE}")
        except Exception as e:
            logger.error(f"Error processing Iceberg: {e}")

    def shutdown(self) -> None:
        """Shutdown the Kafka consumer gracefully"""
        self.consumer.close()
        logger.info("Consumer shutdown gracefully")

def main():
    """Main function to run the Kafka consumer"""
    try:
        consumer = KafkaConsumer()
        consumer.consume_messages()
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
