# Venus - WebSocket API Gateway

## Table of Contents
- [Venus - WebSocket API Gateway](#venus---websocket-api-gateway)
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
  - [API Endpoints](#api-endpoints)
    - [HTTP Endpoints](#http-endpoints)
    - [WebSocket Endpoint](#websocket-endpoint)
  - [Data Format](#data-format)
    - [Input Data (from Mars)](#input-data-from-mars)
    - [Output Data (to Kafka)](#output-data-to-kafka)
  - [Security](#security)
    - [API Key Authentication](#api-key-authentication)
    - [CORS Configuration](#cors-configuration)
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

Venus is a FastAPI-based WebSocket server that receives delivery data from Mars simulators, validates incoming data, and publishes it to Kafka for downstream processing. It serves as the real-time data ingestion gateway for the PacketPulse platform.

## Features

- **Real-Time WebSocket Communication**: Receives delivery data from Mars simulators via WebSocket
- **Data Validation**: Full validation of incoming data using Pydantic models
- **Kafka Integration**: Publishes validated data to Kafka topics for downstream processing
- **API Key Authentication**: Secure authentication with configurable API keys
- **Health Monitoring**: Health check and info endpoints for service monitoring
- **High Performance**: Optimized for high-throughput real-time data ingestion

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`
- Access to Kafka cluster (default: localhost:9092)
- Network connectivity for WebSocket clients

## Installation

### Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure settings (optional):**
Edit `src/config/settings.py` to adjust API settings

### Docker Setup

1. **Build the image:**
```bash
docker build -t venus:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up venus
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka bootstrap servers |
| `KAFKA_TOPIC` | `sessions` | Kafka topic for delivery data |
| `KAFKA_CONSUMER_GROUP` | `venus` | Kafka consumer group |
| `MAX_CONNECTIONS` | `1000` | Maximum WebSocket connections |
| `API_KEY` | `mars-secret-key` | API key for authentication |
| `HOST` | `0.0.0.0` | API server host |
| `PORT` | `8000` | API server port |

### Custom Configuration

Edit `src/config/settings.py` to customize:

- `HOST`: API server host (default: 0.0.0.0)
- `PORT`: API server port (default: 8000)
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka cluster addresses
- `KAFKA_TOPIC`: Topic name for delivery data
- `API_KEYS`: Dictionary of valid API keys with permissions
- `CORS_ORIGINS`: CORS settings for HTTP endpoints

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

# Start Venus API
docker-compose up venus

# Or run in detached mode
docker-compose up -d venus
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t venus:latest .
docker run --network packetpulse_network -p 8000:8000 venus:latest
```

## API Endpoints

### HTTP Endpoints

- `GET /`: API information and status
- `GET /health`: Health check endpoint
- `GET /info`: Information about connected devices (requires API key)

### WebSocket Endpoint

- `WebSocket /ws`: WebSocket endpoint for receiving packet delivery data

## Data Format

### Input Data (from Mars)

Packet delivery data received via WebSocket:

```json
{
  "device_id": "uuid-of-device",
  "vehicle_id": "uuid-of-vehicle",
  "session_id": "uuid-of-session", 
  "order_number": "sequential-order-number",
  "timestamp": "unix-timestamp",
  "current_lat": 40.7527,
  "current_lon": -73.9772,
  "start_lat": 40.7527,
  "start_lon": -73.9772,
  "end_lat": 40.7580,
  "end_lon": -73.9855,
  "status": "en_route"
}
```

### Output Data (to Kafka)

Validated and enriched data published to Kafka:

```json
{
  "device_id": "uuid-of-device",
  "vehicle_id": "uuid-of-vehicle",
  "session_id": "uuid-of-session",
  "order_id": "sequential-order-number",
  "status": "en_route",
  "timestamp": "2025-01-19T12:34:56.789Z",
  "start_lat": 40.7527,
  "start_lon": -73.9772,
  "end_lat": 40.7580,
  "end_lon": -73.9855,
  "current_lat": 40.7527,
  "current_lon": -73.9772
}
```

## Security

### API Key Authentication

Venus uses API key authentication with configurable permissions:
- Default keys: "mars-secret-key" (write access)
- Keys should be sent in HTTP header "X-API-Key" for HTTP endpoints
- WebSocket connections validate API keys for data integrity

### CORS Configuration

Configurable CORS settings for HTTP endpoints:
- Default: Allow all origins for development
- Production: Restrict to specific domains

## Monitoring

### Health Checks

- **Service Health**: `/health` endpoint for load balancer integration
- **Kafka Connectivity**: Automatic monitoring of Kafka connection status
- **WebSocket Connections**: Real-time tracking of active connections

### Logging

Comprehensive logging including:
- WebSocket connection events
- Data validation results
- Kafka publishing status
- Error handling and recovery

## Performance

### Optimization Features

- **Connection Pooling**: Efficient WebSocket connection management
- **Batch Processing**: Optimized Kafka message publishing
- **Memory Management**: Efficient data handling for high throughput
- **Error Recovery**: Automatic reconnection and retry mechanisms

### Scaling

For high-throughput scenarios:
```bash
# Scale Venus API instances
docker-compose up -d --scale venus=3
```

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**: Ensure Kafka cluster is running and accessible
2. **WebSocket Connection Issues**: Check network configuration and firewall settings
3. **Authentication Errors**: Verify API keys match between Mars and Venus
4. **High Memory Usage**: Monitor connection count and adjust MAX_CONNECTIONS

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
```

## Integration

Venus integrates with the PacketPulse platform:
- **Input**: Real-time delivery data from Mars simulators
- **Processing**: Data validation and enrichment
- **Output**: Validated data to Kafka for Neptune/Jupiter processing
- **Monitoring**: Health status for infrastructure management
