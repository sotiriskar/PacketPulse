# Neptune - Bronze Layer Raw Data Ingestion

<img width="1440" height="518" alt="neptune_1440x518_transparent" src="https://github.com/user-attachments/assets/4ddf4d59-d2f9-4962-9d67-c567d4e9ff95" />

## Table of Contents
- [Neptune - Bronze Layer Raw Data Ingestion](#neptune---bronze-layer-raw-data-ingestion)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [Local Development](#local-development)
    - [Docker Setup](#docker-setup)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Custom Configuration](#custom-configuration)
  - [Usage](#usage)
    - [Running Locally](#running-locally)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Running Individual Docker Container](#running-individual-docker-container)
  - [Data Flow](#data-flow)
    - [Bronze Layer Process](#bronze-layer-process)
    - [Table Schema](#table-schema)
  - [Bronze Layer Principles](#bronze-layer-principles)
  - [Monitoring](#monitoring)
    - [Health Checks](#health-checks)
    - [Logging](#logging)
  - [Performance](#performance)
    - [Optimization Features](#optimization-features)
    - [Scaling](#scaling)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Mode](#debug-mode)
  - [Integration](#integration)

## Overview

Neptune serves as the **bronze layer** in the PacketPulse data pipeline, responsible for consuming real-time delivery data from Kafka and storing it as-is in Iceberg tables on MinIO S3. It implements the bronze layer pattern for raw data preservation and basic validation.

## Features

- **Real-Time Data Consumption**: Consumes delivery data from Kafka topic `sessions`
- **Raw Data Preservation**: Stores data exactly as received without transformations
- **Iceberg Integration**: Uses Apache Iceberg for reliable table management
- **MinIO S3 Storage**: Leverages MinIO for scalable object storage
- **Data Validation**: Basic validation using Pydantic models
- **Health Monitoring**: Comprehensive health checks and error handling

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`
- Access to Kafka cluster (default: localhost:9092)
- Access to MinIO S3 storage (default: http://minio:9000)
- Access to Iceberg REST service (default: http://iceberg-rest:8181)

## Installation

### Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure environment variables:**
```bash
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export MINIO_ENDPOINT=http://localhost:9000
export ICEBERG_REST_URL=http://localhost:8181
```

### Docker Setup

1. **Build the image:**
```bash
docker build -t neptune:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up neptune
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka bootstrap servers |
| `KAFKA_TOPIC` | `sessions` | Kafka topic to consume from |
| `KAFKA_CONSUMER_GROUP` | `neptune` | Kafka consumer group |
| `ICEBERG_REST_URL` | `http://iceberg-rest:8181` | Iceberg REST service URL |
| `MINIO_ENDPOINT` | `http://minio:9000` | MinIO endpoint |
| `MINIO_ACCESS_KEY` | `admin` | MinIO access key |
| `MINIO_SECRET_KEY` | `password` | MinIO secret key |

### Custom Configuration

Edit `src/config/settings.py` to customize:
- Kafka connection parameters
- MinIO storage settings
- Iceberg table configuration
- Logging levels

## Usage

### Running Locally

```bash
python main.py
```

### Running with Docker Compose

From the Infrastructure directory:
```bash
# Start all services
docker-compose up -d

# Start Neptune bronze layer
docker-compose up neptune

# Or run in detached mode
docker-compose up -d neptune
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t neptune:latest .
docker run --network packetpulse_network neptune:latest
```

## Data Flow

### Bronze Layer Process

1. **Service Startup**: Waits for MinIO and Iceberg REST services
2. **Table Initialization**: Creates `raw_delivery_data` table if it doesn't exist
3. **Kafka Consumption**: Starts consuming from the configured topic
4. **Data Validation**: Validates each message against the DeliveryData model
5. **Raw Storage**: Stores validated data exactly as received (no transformations)
6. **Monitoring**: Logs processing status and errors

### Table Schema

**raw_delivery_data** - Raw delivery data stored exactly as received:

| Column | Type | Description |
|--------|------|-------------|
| `device_id` | String | UUID of the device |
| `vehicle_id` | String | UUID of the vehicle |
| `session_id` | String | UUID of the session |
| `order_id` | String | Order identifier |
| `status` | String | Delivery status |
| `timestamp` | Timestamp | Event timestamp |
| `start_lat` | Double | Starting latitude |
| `start_lon` | Double | Starting longitude |
| `end_lat` | Double | Destination latitude |
| `end_lon` | Double | Destination longitude |
| `current_lat` | Double | Current latitude |
| `current_lon` | Double | Current longitude |
| `event_date` | Date | Partitioned by day |

## Bronze Layer Principles

This implementation follows bronze layer best practices:

- **Store Raw Data Only**: No calculations, aggregations, or transformations
- **Preserve Data Integrity**: Store exactly what comes from the source
- **Basic Validation**: Ensure data structure is correct
- **Reliable Storage**: Ensure data is safely stored for downstream processing

## Monitoring

### Health Checks

- **Service Health**: Automatic monitoring of service status
- **Kafka Connectivity**: Real-time Kafka connection monitoring
- **MinIO Storage**: Storage availability and performance tracking
- **Iceberg Tables**: Table health and partition management

### Logging

Comprehensive logging including:
- Service startup and initialization
- Table creation and management
- Message processing status
- Validation errors and warnings
- Storage operations

## Performance

### Optimization Features

- **Batch Processing**: Efficient Iceberg write operations
- **Partitioning**: Daily partitioning for query optimization
- **Error Recovery**: Automatic retry mechanisms
- **Memory Management**: Optimized data handling

### Scaling

For high-throughput scenarios:
```bash
# Scale Neptune instances
docker-compose up -d --scale neptune=2
```

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**: Ensure Kafka cluster is running
2. **MinIO Access Denied**: Verify MinIO credentials and permissions
3. **Iceberg Service Unavailable**: Check Iceberg REST service status
4. **Table Creation Errors**: Verify MinIO storage capacity and permissions

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
```

## Integration

Neptune integrates with the PacketPulse platform:
- **Input**: Real-time delivery data from Kafka (via Venus)
- **Processing**: Raw data validation and storage
- **Output**: Iceberg tables on MinIO S3 for downstream processing
- **Downstream**: Data available for Jupiter (Silver) and Uranus (Gold) layers
