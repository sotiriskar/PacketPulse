# Jupiter - Silver Layer Stream Processor

<img width="1440" height="518" alt="jupiter_1440x518_transparent" src="https://github.com/user-attachments/assets/7283e1a7-f964-4445-a4ef-bab99d3bff40" />

## Table of Contents
- [Jupiter - Silver Layer Stream Processor](#jupiter---silver-layer-stream-processor)
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
    - [Silver Layer Process](#silver-layer-process)
    - [Table Schemas](#table-schemas)
      - [sessions\_base](#sessions_base)
      - [session\_events](#session_events)
      - [session\_movements](#session_movements)
  - [Data Models](#data-models)
    - [Input Data (from Kafka)](#input-data-from-kafka)
  - [Architecture](#architecture)
    - [Service Components](#service-components)
    - [Processing Pipeline](#processing-pipeline)
  - [Performance](#performance)
    - [Optimization Features](#optimization-features)
    - [Scaling](#scaling)
  - [Monitoring](#monitoring)
    - [Health Checks](#health-checks)
    - [Logging](#logging)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Mode](#debug-mode)
  - [Integration](#integration)
  - [Silver Layer Principles](#silver-layer-principles)

## Overview

Jupiter is a real-time stream processing service that transforms delivery data from Kafka and stores it in ClickHouse. It serves as the **silver layer** in the PacketPulse data pipeline, handling data cleaning, enrichment, and structured storage for analytics.

## Features

- **Real-Time Stream Processing**: Processes session data from Kafka using Apache Flink
- **Multi-Table Storage**: Stores data in three optimized ClickHouse tables
- **Data Transformation**: Cleans and enriches raw delivery data
- **High Performance**: Optimized for high-throughput real-time processing
- **Fault Tolerance**: Automatic recovery and error handling
- **Scalable Architecture**: Supports horizontal scaling for increased throughput

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`
- Access to Kafka cluster (default: localhost:9092)
- Access to ClickHouse server (default: localhost:8123)
- Apache Flink runtime environment

## Installation

### Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure environment variables:**
```bash
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export CLICKHOUSE_HOST=localhost
export CLICKHOUSE_PORT=8123
```

### Docker Setup

1. **Build the image:**
```bash
docker build -t jupiter:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up jupiter
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka bootstrap servers |
| `KAFKA_TOPIC` | `sessions` | Kafka topic to consume from |
| `KAFKA_CONSUMER_GROUP` | `jupiter-consumer-group` | Kafka consumer group |
| `CLICKHOUSE_HOST` | `clickhouse` | ClickHouse server host |
| `CLICKHOUSE_PORT` | `8123` | ClickHouse server port |
| `CLICKHOUSE_USER` | `default` | ClickHouse username |
| `CLICKHOUSE_DATABASE` | `default` | ClickHouse database name |
| `FLINK_PARALLELISM` | `4` | Flink job parallelism |
| `FLINK_JOB_NAME` | `Jupiter-ClickHouse-Pipeline` | Flink job name |
| `LOG_LEVEL` | `INFO` | Logging level |

### Custom Configuration

Edit `src/config/settings.py` to customize:
- Kafka connection parameters
- ClickHouse table schemas
- Flink job configuration
- Data processing logic

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

# Start Jupiter silver layer
docker-compose up jupiter

# Or run in detached mode
docker-compose up -d jupiter
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t jupiter:latest .
docker run --network packetpulse_network -p 8081:8081 jupiter:latest
```

## Data Flow

### Silver Layer Process

1. **Kafka Consumer**: Reads session data from `sessions-topic`
2. **Data Processing**: Transforms JSON messages into structured data
3. **ClickHouse Sink**: Inserts data into three optimized tables:
   - `sessions_base` (immutable session headers)
   - `session_events` (status change events)
   - `session_movements` (GPS movement data)

### Table Schemas

#### sessions_base
Immutable session headers created once per session:
```sql
CREATE TABLE sessions_base (
    session_id String,
    vehicle_id String,
    order_id String,
    start_lat Float64,
    start_lon Float64,
    end_lat Float64,
    end_lon Float64,
    created_at DateTime,
    PRIMARY KEY (session_id)
) ENGINE = MergeTree()
ORDER BY session_id;
```

#### session_events
Status change events for every status update:
```sql
CREATE TABLE session_events (
    session_id String,
    status String,
    timestamp DateTime,
    event_id String,
    PRIMARY KEY (session_id, timestamp)
) ENGINE = MergeTree()
ORDER BY (session_id, timestamp);
```

#### session_movements
GPS movement data for every location ping:
```sql
CREATE TABLE session_movements (
    session_id String,
    current_lat Float64,
    current_lon Float64,
    timestamp DateTime,
    movement_id String,
    PRIMARY KEY (session_id, timestamp)
) ENGINE = MergeTree()
ORDER BY (session_id, timestamp);
```

## Data Models

### Input Data (from Kafka)
```json
{
  "session_id": "f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f",
  "vehicle_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "order_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  "status": "en_route",
  "timestamp": "2025-01-19T12:34:56.789Z",
  "start_lat": 40.7527,
  "start_lon": -73.9772,
  "end_lat": 40.7580,
  "end_lon": -73.9855,
  "current_lat": 40.7550,
  "current_lon": -73.9800
}
```

## Architecture

### Service Components

- **`JupiterService`**: Main orchestrator in `main.py`
- **`ClickHouseManager`**: Handles ClickHouse connections and operations
- **`ClickHouseSink`**: Flink MapFunction for data processing
- **`DataProcessor`**: Utility class for data transformations

### Processing Pipeline

```
Kafka → Flink Job → Data Transformation → ClickHouse Tables
```

## Performance

### Optimization Features

- **Parallel Processing**: Configurable Flink parallelism
- **Batch Writes**: Optimized ClickHouse insert operations
- **Memory Management**: Efficient data handling for high throughput
- **Error Recovery**: Automatic retry mechanisms

### Scaling

For high-throughput scenarios:
```bash
# Scale Jupiter instances
docker-compose up -d --scale jupiter=2

# Increase Flink parallelism
export FLINK_PARALLELISM=8
```

## Monitoring

### Health Checks

- **Service Health**: Automatic monitoring of Flink job status
- **Kafka Connectivity**: Real-time Kafka connection monitoring
- **ClickHouse Performance**: Database connection and query monitoring
- **Processing Metrics**: Throughput and latency tracking

### Logging

Comprehensive logging including:
- Flink job startup and configuration
- Data processing statistics
- ClickHouse operation status
- Error handling and recovery

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**: Ensure Kafka cluster is running
2. **ClickHouse Connection Failed**: Verify ClickHouse server is accessible
3. **Flink Job Failures**: Check Flink runtime and configuration
4. **Memory Issues**: Adjust Flink memory settings for high throughput

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
```

## Integration

Jupiter integrates with the PacketPulse platform:
- **Input**: Real-time delivery data from Kafka (via Venus)
- **Processing**: Data cleaning, enrichment, and transformation
- **Output**: Structured data in ClickHouse for analytics
- **Downstream**: Data available for Uranus (Gold) layer and Mercury dashboard

## Silver Layer Principles

This implementation follows silver layer best practices:
- **Data Cleaning**: Remove invalid or duplicate records
- **Data Enrichment**: Add derived fields and calculations
- **Structured Storage**: Optimize data for analytical queries
- **Real-Time Processing**: Process data as it arrives
