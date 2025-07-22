import os


# Kafka Configuration
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "sessions-topic")
KAFKA_CONSUMER_GROUP = os.getenv("KAFKA_CONSUMER_GROUP", "jupiter-consumer-group")

# ClickHouse Configuration
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "clickhouse")
CLICKHOUSE_PORT = os.getenv("CLICKHOUSE_PORT", "8123")
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_DB = os.getenv("CLICKHOUSE_DATABASE", "default")

# ClickHouse Table Names
TAB_MOVEMENTS = os.getenv("CLICKHOUSE_TABLE_MOVEMENTS", "session_movements")
TAB_EVENTS = os.getenv("CLICKHOUSE_TABLE_EVENTS", "session_events")
TAB_BASE = os.getenv("CLICKHOUSE_TABLE_BASE", "sessions_base")

# Flink Configuration
FLINK_PARALLELISM = int(os.getenv("FLINK_PARALLELISM", "1"))
FLINK_JOB_NAME = os.getenv("FLINK_JOB_NAME", "Jupiter-ClickHouse-Pipeline")

# Connection Retry Settings
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "10"))
RETRY_DELAY = int(os.getenv("RETRY_DELAY", "2"))

# Logging Configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s' 