from src.models.delivery import validate_delivery_message
from src.utils.iceberg import initialize_iceberg_table
from confluent_kafka import Consumer
from src.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_CONSUMER_GROUP,
    KAFKA_TOPIC
)
import pyarrow as pa
import pandas as pd
import logging
import json


# structured logging
logger = logging.getLogger("main")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(
    logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
)
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
            'auto.offset.reset': 'earliest',
            'max.poll.interval.ms': 600000,
        }
        self.consumer = Consumer(self.config)
        self.topic = KAFKA_TOPIC
        self.table = None

        # how many messages per batch
        self._batch_size = 100_000
        # how long to wait for a first message (in seconds)
        self._poll_timeout = 0.1

    def initialize_iceberg_table(self) -> None:
        """Initialize the Iceberg table once when the consumer starts."""
        try:
            self.table = initialize_iceberg_table()
        except Exception as e:
            logger.error(f"Error initializing Iceberg table: {e}")
            raise

    def consume_messages(self) -> None:
        """Continuously drain Kafka in large batches and write each batch immediately."""
        self.initialize_iceberg_table()
        self.consumer.subscribe([self.topic])
        logger.info("Consumer running…")

        try:
            while True:
                # 1) Bulk‐poll up to _batch_size records, waiting at most _poll_timeout
                msgs = self.consumer.consume(
                    num_messages=self._batch_size,
                    timeout=self._poll_timeout
                )

                # 2) Filter out errors & None
                valid = []
                for msg in msgs:
                    if msg is None:
                        continue
                    if msg.error():
                        logger.error(f"Kafka error: {msg.error()}")
                    else:
                        valid.append(msg)

                # 3) If we got any messages, process and write them in one shot
                if valid:
                    # a) Decode + validate all at once
                    records = []
                    for msg in valid:
                        try:
                            data = json.loads(msg.value().decode('utf-8'))
                            validated = validate_delivery_message(data)
                            records.append(validated.model_dump())
                        except Exception as e:
                            logger.error(f"Validation error: {e}")

                    # b) Build one DataFrame / Arrow Table
                    df = pd.DataFrame(records)
                    df['timestamp'] = df['timestamp'].astype(str)
                    table = pa.Table.from_pandas(df)

                    # c) Append in one big batch
                    try:
                        self.table.append(table)
                        logger.info(f"📦 Uploaded batch of {len(records)} rows")
                    except Exception as e:
                        logger.error(f"Iceberg append error: {e}")
                # else: no messages this round → just loop back immediately

        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        finally:
            self.shutdown()

    def shutdown(self) -> None:
        """Shutdown the Kafka consumer gracefully."""
        self.consumer.close()
        logger.info("Consumer shutdown gracefully")


def main():
    try:
        consumer = KafkaConsumer()
        consumer.consume_messages()
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
