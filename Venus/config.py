# API Server settings
HOST = "0.0.0.0"
PORT = 8000
WORKERS = 4  # Number of Uvicorn workers for better performance

# Kafka settings
KAFKA_BOOTSTRAP_SERVERS = "kafka:9092"
KAFKA_TOPIC = "sessions"
KAFKA_CONSUMER_GROUP = "venus"

# Connection management
MAX_CONCURRENT_CONNECTIONS = 5000  # Limit concurrent WebSocket connections

# Security settings
API_KEYS = {
    "simulator123": {
        "name": "Mars Simulator",
        "permissions": ["write"],
        "created_at": "2023-01-01T00:00:00"
    },
    "reader456": {
        "name": "Dashboard Reader",
        "permissions": ["read"],
        "created_at": "2023-01-01T00:00:00"
    }
}

# CORS settings
CORS_ORIGINS = ["*"]  # Set to specific origins in production

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Performance tuning
WEBSOCKET_PING_INTERVAL = 30  # Seconds between WebSocket ping messages
WEBSOCKET_PING_TIMEOUT = 10  # Seconds to wait for pong response
KAFKA_BATCH_SIZE = 16384  # Kafka producer batch size in bytes 
