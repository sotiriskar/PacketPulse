# Packetpulse - Real-Time Delivery Tracking Platform

<img width="1440" height="518" src="https://github.com/user-attachments/assets/ae492a48-e685-4f92-9642-120a7719a2db" />

## Table of Contents
- [Packetpulse - Real-Time Delivery Tracking Platform](#packetpulse---real-time-delivery-tracking-platform)
  - [Table of Contents](#table-of-contents)
  - [Architecture Overview](#architecture-overview)
  - [Planet Components](#planet-components)
    - [🚀 Mars - Delivery Simulator](#-mars---delivery-simulator)
    - [🌟 Venus - WebSocket API Gateway](#-venus---websocket-api-gateway)
    - [🌊 Neptune - Bronze Layer Processor](#-neptune---bronze-layer-processor)
    - [⚡ Jupiter - Silver Layer Processor](#-jupiter---silver-layer-processor)
    - [🪐 Uranus - Data Transformation (dbt)](#-uranus---data-transformation-dbt)
    - [🌍 Mercury - Full Stack Dashboard](#-mercury---full-stack-dashboard)
  - [Quick Start](#quick-start)
    - [Prerequisites](#prerequisites)
    - [Running the Complete Platform](#running-the-complete-platform)
    - [Individual Component Setup](#individual-component-setup)
  - [Technology Stack](#technology-stack)
  - [Contributing](#contributing)
  - [License](#license)


PacketPulse is a comprehensive real-time delivery tracking platform that simulates, processes, and visualizes package delivery data through a modern data engineering architecture. The system provides end-to-end visibility into delivery operations with real-time analytics and interactive dashboards.

## Architecture Overview

The platform follows a modern data pipeline architecture:

```
Mars (Simulation) → Venus (FastAPI WebSocket) → Kafka ↔ Neptune (Bronze Layer) / Jupiter (Silver Layer) → Uranus (dbt Gold Layer) → ClickHouse → Mercury (Full Stack Platform)
```

**Data Flow:**
- **Bronze Layer**: Raw data stored in Iceberg tables on MinIO S3
- **Silver Layer**: Processed data stored in ClickHouse
- **Gold Layer**: Business logic and aggregations via dbt
- **Analytics**: SQLPad and Trino for querying MinIO/Iceberg data

## Planet Components

### 🚀 Mars - Delivery Simulator
Simulates multiple delivery vehicles with real-time GPS tracking, generating realistic delivery scenarios with configurable routes, speeds, and status updates. Sends data via WebSocket to Venus API.

### 🌟 Venus - WebSocket API Gateway
FastAPI-based WebSocket server that receives delivery data from Mars simulators, validates incoming data, and publishes it to Kafka for downstream processing. Handles real-time data ingestion with authentication.

### 🌊 Neptune - Bronze Layer Processor
Consumes raw delivery data from Kafka and stores it unchanged in Iceberg tables on MinIO S3. Implements the bronze layer pattern for raw data preservation and basic validation.

### ⚡ Jupiter - Silver Layer Processor
Real-time stream processing service using PyFlink that transforms delivery data from Kafka and stores it in ClickHouse. Handles data cleaning, enrichment, and structured storage for analytics.

### 🪐 Uranus - Data Transformation (dbt)
dbt-based data transformation layer that creates business-ready models and aggregations. Processes data from ClickHouse to generate KPIs, session summaries, and analytical views.

### 🌍 Mercury - Full Stack Dashboard
Next.js-based real-time dashboard with interactive maps, analytics, and user authentication. Provides comprehensive delivery tracking visualization and fleet management capabilities.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local Mercury development)

### Running the Complete Platform

1. **Start all services:**
```bash
cd Infrastructure
docker-compose up -d
```

2. **Access the applications:**
- **Mercury Dashboard**: http://localhost:3000 (admin/password)
- **SQLPad Analytics**: http://localhost:3002 (admin@example.com/password)
- **Trino Query Engine**: http://localhost:8080
- **MinIO Console**: http://localhost:9001 (admin/password)

3. **Start simulation:**
```bash
docker-compose up mars
```

### Individual Component Setup

Each component can be run independently. See individual README files for detailed setup instructions:

- [Mars Documentation](Mars/README.md)
- [Venus Documentation](Venus/README.md)
- [Neptune Documentation](Neptune/README.md)
- [Jupiter Documentation](Jupiter/README.md)
- [Uranus Documentation](Uranus/README.md)
- [Mercury Documentation](Mercury/README.md)
- [Infrastructure Documentation](Infrastructure/README.md)

## Technology Stack

- **Data Processing**: Apache Kafka, Apache Flink, dbt
- **Storage**: ClickHouse, Apache Iceberg, MinIO S3
- **Analytics**: Trino, SQLPad
- **Frontend**: Next.js, TypeScript, Material-UI
- **Backend**: FastAPI, WebSockets
- **Infrastructure**: Docker, Docker Compose

## Contributing

We welcome contributions to PacketPulse! Here's how you can help:

### Getting Started

1. **Fork the repository** and clone it locally
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit them
4. **Push to your fork** and create a pull request

### Reporting Issues

- **Search existing issues** before creating a new one
- **Include details** about your environment and steps to reproduce
- **Add logs** and error messages when applicable

### Pull Requests

- **Describe your changes** clearly in the PR description
- **Add tests** for new functionality
- **Update documentation** if needed
- **Ensure all checks pass** before submitting

### Code Style

- **Python**: Follow PEP 8 standards
- **TypeScript**: Use ESLint and Prettier
- **SQL**: Follow dbt style guide
- **Documentation**: Update README files for new features

### Getting Help

- Check the individual component READMEs for detailed setup instructions
- Open an issue for bugs or feature requests
- Ask questions in GitHub Discussions

By contributing, you agree that your contributions will be licensed under the MIT License.
