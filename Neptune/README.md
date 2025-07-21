# Neptune - Bronze Layer Raw Data Ingestion

Neptune serves as the **bronze layer** in the PacketPulse data pipeline, responsible for consuming real-time delivery data from Kafka and storing it as-is in Iceberg tables on MinIO S3.

## Overview

Neptune implements the bronze layer pattern, which focuses on:
- **Raw data ingestion**: Consuming data exactly as received from Kafka
- **Basic validation**: Ensuring data structure meets expected schema
- **Reliable storage**: Storing validated raw data without any transformations
- **Real-time processing**: Processing data as it arrives

## Architecture

```
Kafka → Neptune (Bronze Layer) → Raw Data Table (MinIO S3)
```

## Features

### 🕐 Real-time Data Consumption
- Consumes delivery data from Kafka topic `sessions`
- Processes messages as they arrive
- Handles Kafka consumer group management

### ✅ Data Validation
- Validates incoming data against Pydantic models
- Ensures required fields are present and correctly typed
- Logs validation errors for monitoring

### 🏗️ Simple Table Management
- Creates a single `raw_delivery_data` table if it doesn't exist
- Implements proper table schema with date partitioning
- Handles table initialization on startup

### 🔄 Service Health Checks
- Waits for MinIO and Iceberg REST services to be ready
- Implements retry logic with exponential backoff
- Ensures all dependencies are available before processing

## Table

### raw_delivery_data
Raw delivery data stored exactly as received from Kafka:
- `device_id`, `vehicle_id`, `session_id`, `order_id` (identifiers)
- `status`, `timestamp` (status information)
- `start_lat`, `start_lon`, `end_lat`, `end_lon`, `current_lat`, `current_lon` (location)
- `event_date` (partitioned by day)

**No calculations, no summaries, no transformations - just raw data!**

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka bootstrap servers |
| `KAFKA_TOPIC` | `sessions` | Kafka topic to consume from |
| `KAFKA_CONSUMER_GROUP` | `neptune` | Kafka consumer group |
| `ICEBERG_REST_URL` | `http://iceberg-rest:8181` | Iceberg REST service URL |
| `MINIO_ENDPOINT` | `http://minio:9000` | MinIO endpoint |
| `MINIO_ACCESS_KEY` | `admin` | MinIO access key |
| `MINIO_SECRET_KEY` | `password` | MinIO secret key |

## Usage

### Running with Docker Compose
```bash
cd Infrastructure
docker-compose up neptune
```

### Manual Setup
```bash
cd Neptune
pip install -r requirements.txt
python main.py
```

## Data Flow

1. **Service Startup**: Waits for MinIO and Iceberg REST services
2. **Table Initialization**: Creates `raw_delivery_data` table if it doesn't exist
3. **Kafka Consumption**: Starts consuming from the configured topic
4. **Data Validation**: Validates each message against the DeliveryData model
5. **Raw Storage**: Stores validated data exactly as received (no transformations)
6. **Monitoring**: Logs processing status and errors

## Error Handling

- **Invalid JSON**: Logs warning and skips message
- **Validation Errors**: Logs warning and skips message
- **Service Unavailable**: Retries with exponential backoff
- **Table Creation Errors**: Fails startup if table can't be created

## Monitoring

The service provides detailed logging including:
- Service health status
- Table creation/initialization
- Message processing status
- Validation errors
- Raw data storage operations

## Bronze Layer Principles

This implementation follows bronze layer best practices:
- **Store raw data only**: No calculations, aggregations, or transformations
- **Preserve data integrity**: Store exactly what comes from the source
- **Basic validation**: Ensure data structure is correct
- **Reliable storage**: Ensure data is safely stored for downstream processing

## Next Steps

This bronze layer provides the foundation for:
- **Silver Layer**: Data cleaning and transformation
- **Gold Layer**: Business logic and aggregation
- **Analytics**: Real-time dashboards and reporting 