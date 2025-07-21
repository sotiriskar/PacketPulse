from dotenv import load_dotenv
import os

load_dotenv()

# Kafka Settings
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'sessions')
KAFKA_CONSUMER_GROUP = os.getenv('KAFKA_CONSUMER_GROUP', 'neptune')

# Iceberg REST Settings
ICEBERG_REST_URL = os.getenv('ICEBERG_REST_URL', 'http://iceberg-rest:8181')
ICEBERG_CATALOG = os.getenv('ICEBERG_CATALOG', 'catalog')
ICEBERG_NAMESPACE = os.getenv('ICEBERG_NAMESPACE', 'default')
ICEBERG_TABLE = os.getenv('ICEBERG_TABLE', 'sessions')

# MinIO Settings
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'http://minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'admin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'password')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'neptune')
