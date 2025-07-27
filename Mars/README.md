# Mars - Delivery Simulator

## Table of Contents
- [Mars - Delivery Simulator](#mars---delivery-simulator)
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
  - [Data Format](#data-format)
  - [Simulation Behavior](#simulation-behavior)
  - [Monitoring](#monitoring)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Mode](#debug-mode)
  - [Integration](#integration)

## Overview

Mars is a sophisticated delivery simulation component that generates realistic packet delivery data and transmits it to the Venus API via WebSocket. It simulates multiple delivery vehicles with real-time GPS tracking, configurable routes, and status updates.

## Features

- **Multi-Device Simulation**: Simulates multiple devices delivering packets from point A to point B
- **Real-Time GPS Tracking**: UUID-based identifiers for devices, vehicles, and sessions with live position updates
- **Configurable Routes**: Randomized start and end locations from a configurable list
- **Speed Validation**: Realistic speed simulation (0-120 km/h equivalent)
- **Status Tracking**: Complete delivery lifecycle (not_started → en_route → completed)
- **WebSocket Communication**: Real-time data transmission to Venus API

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`
- Network access to Venus API (default: ws://localhost:8000/ws)

## Installation

### Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure settings (optional):**
Edit `src/config/settings.py` to adjust simulation parameters

### Docker Setup

1. **Build the image:**
```bash
docker build -t mars:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up mars
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBSOCKET_URL` | `ws://venus:8000/ws` | WebSocket URL of Venus API |
| `API_KEY` | `mars-secret-key` | API key for authentication |
| `TOTAL_SESSIONS` | `10` | Number of delivery sessions to simulate |
| `UPDATE_INTERVAL` | `5` | Time between updates in seconds |
| `NUM_DEVICES` | `5` | Number of devices to simulate |

### Custom Configuration

Edit `src/config/settings.py` to customize:

- `NUM_DEVICES`: Number of devices to simulate
- `UPDATE_INTERVAL`: Time between updates in seconds
- `API_URL`: WebSocket URL of Venus API
- `API_KEY`: API key for authentication
- `DEFAULT_LOCATIONS`: Dictionary of named locations with coordinates

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

# Start Mars simulator
docker-compose up mars

# Or run in detached mode
docker-compose up -d mars
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t mars:latest .
docker run --network packetpulse_network mars:latest
```

## Data Format

Each delivery record includes:

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

## Simulation Behavior

The simulator will:
1. Initialize packet deliveries with the specified number of devices
2. Begin moving packets along their routes with realistic speeds
3. Send telemetry updates to Venus API via WebSocket
4. Track delivery status through the complete lifecycle
5. Continue until all deliveries are complete or interrupted

## Monitoring

- **Logs**: View simulation progress and connection status
- **WebSocket Status**: Monitor connection to Venus API
- **Delivery Progress**: Track completion status of all sessions

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure Venus API is running and accessible
2. **Authentication Error**: Verify API key matches Venus configuration
3. **Network Issues**: Check Docker network configuration when using containers

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export LOG_LEVEL=DEBUG
```

## Integration

Mars integrates with the PacketPulse platform:
- **Input**: Configuration and simulation parameters
- **Output**: Real-time delivery data via WebSocket to Venus
- **Downstream**: Data flows to Kafka → Neptune/Jupiter → Uranus → Mercury
