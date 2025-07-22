# Jupiter Service

**Real-time stream processing** from Kafka → ClickHouse via PyFlink.

## 🏗️ Architecture

Jupiter processes session data from Kafka and stores it in three ClickHouse tables:

1. **`sessions_base`** - Immutable session headers (created once per session)
2. **`session_events`** - Status change events (every status update)
3. **`session_movements`** - GPS movement data (every location ping)

## 📁 Project Structure

```
Jupiter/
├── main.py                 # Main entry point with JupiterService class
├── src/
│   ├── config/
│   │   └── settings.py    # Configuration management
│   ├── models/
│   │   └── session.py     # Data models for session data
│   └── utils/
│       ├── clickhouse.py  # ClickHouse connection and table management
│       ├── data_processor.py # Data transformation utilities
│       └── sink.py        # Flink MapFunction for ClickHouse sink
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🔧 Prerequisites

- Docker & Docker Compose
- A running Kafka cluster with topic `sessions-topic`
- A running ClickHouse server (default at `clickhouse:8123`)

## 🚀 Quick Start

```bash
# Build the Docker image
docker build -t jupiter:latest .

# Run with Docker Compose (see Infrastructure/)
docker-compose up jupiter
```

## ⚙️ Configuration

Environment variables (with defaults):

```bash
# Kafka Configuration
KAFKA_BOOTSTRAP=kafka:9092
KAFKA_TOPIC=sessions-topic
KAFKA_CONSUMER_GROUP=jupiter-consumer-group

# ClickHouse Configuration
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_DATABASE=default

# Flink Configuration
FLINK_PARALLELISM=1
FLINK_JOB_NAME=Jupiter-ClickHouse-Pipeline

# Logging
LOG_LEVEL=INFO
```

## 🔄 Data Flow

1. **Kafka Consumer** - Reads session data from `sessions-topic`
2. **Data Processing** - Transforms JSON messages into structured data
3. **ClickHouse Sink** - Inserts data into three tables:
   - `sessions_base` (first message with status='started')
   - `session_events` (every status change)
   - `session_movements` (every GPS ping)

## 📊 Data Models

### Session Data (Input)
```json
{
  "session_id": "f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f",
  "vehicle_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "order_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  "status": "en_route",
  "timestamp": "2025-07-19T12:34:56.789Z",
  "start_lat": 40.7527,
  "start_lon": -73.9772,
  "end_lat": 40.7580,
  "end_lon": -73.9855,
  "current_lat": 40.7550,
  "current_lon": -73.9800
}
```

## 🛠️ Development

The service uses a class-based architecture:

- **`JupiterService`** - Main orchestrator in `main.py`
- **`ClickHouseManager`** - Handles ClickHouse connections and operations
- **`ClickHouseSink`** - Flink MapFunction for data processing
- **`DataProcessor`** - Utility class for data transformations
