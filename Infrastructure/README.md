# Infrastructure - PacketPulse Platform

## Table of Contents
- [Infrastructure - PacketPulse Platform](#infrastructure---packetpulse-platform)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture Overview](#architecture-overview)
  - [Requirements](#requirements)
  - [Quick Start](#quick-start)
    - [1. Start All Services](#1-start-all-services)
    - [2. Access the Applications](#2-access-the-applications)
    - [3. Start Simulation](#3-start-simulation)
  - [Service Details](#service-details)
    - [Data Infrastructure](#data-infrastructure)
      - [Kafka \& Zookeeper](#kafka--zookeeper)
      - [Storage Services](#storage-services)
        - [ClickHouse](#clickhouse)
        - [MinIO](#minio)
        - [Apache Iceberg](#apache-iceberg)
    - [Processing Services](#processing-services)
      - [Venus API](#venus-api)
      - [Neptune (Bronze Layer)](#neptune-bronze-layer)
      - [Jupiter (Silver Layer)](#jupiter-silver-layer)
      - [Uranus (Gold Layer)](#uranus-gold-layer)
    - [Analytics Services](#analytics-services)
      - [Trino](#trino)
      - [SQLPad](#sqlpad)
    - [Frontend Services](#frontend-services)
      - [Mercury Dashboard](#mercury-dashboard)
    - [Simulation Services](#simulation-services)
      - [Mars Simulator](#mars-simulator)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
      - [Venus API](#venus-api-1)
      - [Neptune (Bronze)](#neptune-bronze)
      - [Jupiter (Silver)](#jupiter-silver)
      - [Uranus (Gold)](#uranus-gold)
      - [Mercury (Dashboard)](#mercury-dashboard-1)
    - [Network Configuration](#network-configuration)
  - [Data Flow](#data-flow)
    - [Complete Pipeline](#complete-pipeline)
    - [Data Storage Strategy](#data-storage-strategy)
  - [Monitoring](#monitoring)
    - [Service Health](#service-health)
    - [Performance Monitoring](#performance-monitoring)
  - [Scaling](#scaling)
    - [Horizontal Scaling](#horizontal-scaling)
    - [Resource Allocation](#resource-allocation)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Commands](#debug-commands)
    - [Reset Environment](#reset-environment)
  - [Development](#development)
    - [Local Development](#local-development)
  - [License](#license)

## Overview

This directory contains the complete infrastructure setup for the PacketPulse delivery tracking platform using Docker Compose. It orchestrates all services including data processing, storage, analytics, and the web dashboard.

## Architecture Overview

The infrastructure provides a complete data pipeline with the following components:

- **Data Ingestion**: Kafka, Zookeeper, Venus API
- **Data Processing**: Neptune (Bronze), Jupiter (Silver), Uranus (Gold)
- **Storage**: ClickHouse, MinIO S3, Apache Iceberg
- **Analytics**: Trino, SQLPad
- **Frontend**: Mercury Dashboard
- **Simulation**: Mars Simulator

## Requirements

- Docker 20.10+
- Docker Compose 2.0+
- At least 8GB RAM available
- 20GB+ disk space
- Ports 3000, 3002, 8000, 8080, 8123, 9001, 9093 available

## Quick Start

### 1. Start All Services

```bash
# From the Infrastructure directory
docker-compose up -d
```

### 2. Access the Applications

| Service | URL | Credentials | Description |
|---------|-----|-------------|-------------|
| **Mercury Dashboard** | http://localhost:3000 | admin/password | Main delivery tracking dashboard |
| **SQLPad Analytics** | http://localhost:3002 | admin@example.com/password | SQL query interface for analytics |
| **Trino Query Engine** | http://localhost:8080 | - | Distributed SQL query engine |
| **MinIO Console** | http://localhost:9001 | admin/password | S3-compatible object storage |
| **Venus API** | http://localhost:8000 | - | WebSocket API for data ingestion |
| **Kafka** | localhost:9093 | - | Message broker (external access) |

### 3. Start Simulation

```bash
# Start Mars simulator to generate delivery data
docker-compose up mars
```

## Service Details

### Data Infrastructure

#### Kafka & Zookeeper
- **Kafka**: High-throughput message broker for real-time data streaming
- **Zookeeper**: Coordination service for Kafka cluster management
- **Ports**: 9093 (external), 9092 (internal)

#### Storage Services

##### ClickHouse
- **Purpose**: High-performance analytical database for structured data
- **Port**: 8123
- **Data**: Silver layer data from Jupiter, Gold layer models from Uranus

##### MinIO
- **Purpose**: S3-compatible object storage for raw data
- **Ports**: 9000 (API), 9001 (Console)
- **Data**: Bronze layer raw data via Neptune

##### Apache Iceberg
- **Purpose**: Table format for large datasets with schema evolution
- **Port**: 8181
- **Data**: Bronze layer data with Iceberg REST API

### Processing Services

#### Venus API
- **Purpose**: WebSocket API gateway for data ingestion
- **Port**: 8000
- **Input**: Real-time data from Mars simulators
- **Output**: Validated data to Kafka

#### Neptune (Bronze Layer)
- **Purpose**: Raw data ingestion and storage
- **Input**: Kafka topic `sessions`
- **Output**: Iceberg tables on MinIO S3
- **Data**: Raw delivery data without transformations

#### Jupiter (Silver Layer)
- **Purpose**: Real-time stream processing and data transformation
- **Input**: Kafka topic `sessions`
- **Output**: ClickHouse tables
- **Data**: Cleaned and structured delivery data

#### Uranus (Gold Layer)
- **Purpose**: Business logic and data aggregation
- **Input**: ClickHouse tables from Jupiter
- **Output**: Business-ready models in ClickHouse
- **Data**: KPIs, summaries, and analytical views

### Analytics Services

#### Trino
- **Purpose**: Distributed SQL query engine
- **Port**: 8080
- **Data**: Query MinIO/Iceberg data for analytics

#### SQLPad
- **Purpose**: Web-based SQL query interface
- **Port**: 3002
- **Data**: Connect to Trino for ad-hoc analytics

### Frontend Services

#### Mercury Dashboard
- **Purpose**: Real-time delivery tracking dashboard
- **Port**: 3000
- **Features**: Interactive maps, analytics, user authentication
- **Data**: Business-ready data from ClickHouse

### Simulation Services

#### Mars Simulator
- **Purpose**: Generate realistic delivery simulation data
- **Input**: Configuration parameters
- **Output**: Real-time delivery data to Venus API

## Configuration

### Environment Variables

Key environment variables for each service:

#### Venus API
```bash
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_TOPIC=sessions
API_KEY=mars-secret-key
```

#### Neptune (Bronze)
```bash
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
MINIO_ENDPOINT=http://minio:9000
ICEBERG_REST_URL=http://iceberg-rest:8181
```

#### Jupiter (Silver)
```bash
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
CLICKHOUSE_HOST=clickhouse
FLINK_PARALLELISM=4
```

#### Uranus (Gold)
```bash
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_DATABASE=default
```

#### Mercury (Dashboard)
```bash
CLICKHOUSE_HOST=http://clickhouse:8123
JWT_SECRET=your-secret-key
```

### Network Configuration

All services run on the `packetpulse_network` Docker network for internal communication.

## Data Flow

### Complete Pipeline

```
Mars → Venus → Kafka → Neptune (Bronze) → MinIO/Iceberg
                    ↓
                    Jupiter (Silver) → ClickHouse
                                        ↓
                    Uranus (Gold) → ClickHouse → Mercury
```

### Data Storage Strategy

- **Bronze Layer**: Raw data in Iceberg tables on MinIO S3
- **Silver Layer**: Structured data in ClickHouse tables
- **Gold Layer**: Business models in ClickHouse tables

## Monitoring

### Service Health

```bash
# Check all service status
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Check specific service health
docker-compose exec [service-name] [health-check-command]
```

### Performance Monitoring

- **Kafka**: Monitor message throughput and lag
- **ClickHouse**: Track query performance and storage usage
- **MinIO**: Monitor storage capacity and access patterns
- **Services**: Check resource usage and response times

## Scaling

### Horizontal Scaling

```bash
# Scale Venus API for higher throughput
docker-compose up -d --scale venus=3

# Scale Jupiter for increased processing
docker-compose up -d --scale jupiter=2

# Scale Neptune for more data ingestion
docker-compose up -d --scale neptune=2
```

### Resource Allocation

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  jupiter:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure required ports are available
2. **Memory Issues**: Increase Docker memory allocation
3. **Service Startup Failures**: Check dependency order and health checks
4. **Data Persistence**: Verify volume mounts and permissions

### Debug Commands

```bash
# Check service logs
docker-compose logs [service-name]

# Access service shell
docker-compose exec [service-name] /bin/bash

# Check network connectivity
docker-compose exec [service-name] ping [other-service]

# Verify data flow
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Reset Environment

```bash
# Stop all services
docker-compose down

# Remove all data volumes
docker-compose down -v

# Rebuild all images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## Development

### Local Development

For development, you can run individual services:

```bash
# Start only infrastructure services
docker-compose up -d kafka zookeeper minio iceberg-rest trino sqlpad clickhouse

# Run specific service locally
cd ../[ServiceName]
python main.py  # or npm run dev for Mercury
```

## License

This infrastructure setup is part of the PacketPulse project and is licensed under the MIT License. 
