# Uranus - Data Transformation (dbt)

<img width="1440" height="518" alt="uranus_1440x518_transparent" src="https://github.com/user-attachments/assets/6b89de23-b861-4d73-9209-b3c04d964d74" />

## Table of Contents
- [Uranus - Data Transformation (dbt)](#uranus---data-transformation-dbt)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [Local Development](#local-development)
    - [Docker Setup](#docker-setup)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [dbt Configuration](#dbt-configuration)
  - [Usage](#usage)
    - [Running Locally](#running-locally)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Running Individual Docker Container](#running-individual-docker-container)
  - [Data Models](#data-models)
    - [Gold Layer Models](#gold-layer-models)
      - [active\_sessions](#active_sessions)
      - [session\_summary](#session_summary)
      - [fleet\_summary](#fleet_summary)
      - [kpi\_aggregates](#kpi_aggregates)
      - [users](#users)
    - [Model Dependencies](#model-dependencies)
  - [Data Flow](#data-flow)
    - [Gold Layer Process](#gold-layer-process)
  - [Integration](#integration)


## Overview

Uranus is the **gold layer** in the PacketPulse data pipeline, responsible for creating business-ready models and aggregations using dbt (data build tool). It processes data from ClickHouse to generate KPIs, session summaries, and analytical views for the Mercury dashboard.

## Features

- **Business Logic Implementation**: Creates business-ready models and KPIs
- **Data Aggregation**: Generates session summaries and fleet analytics
- **User Management**: Handles user authentication and profile data
- **Real-Time Analytics**: Provides real-time insights for dashboard
- **Data Quality**: Implements data quality tests and validation
- **Documentation**: Comprehensive model documentation and lineage

## Requirements

- Python 3.9+
- dbt-core and dbt-clickhouse
- Access to ClickHouse server (default: localhost:8123)
- Dependencies listed in `requirements.txt`

## Installation

### Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure dbt profiles:**
Edit `profiles.yml` with your ClickHouse connection details

3. **Install dbt dependencies:**
```bash
dbt deps
```

### Docker Setup

1. **Build the image:**
```bash
docker build -t uranus:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up uranus
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLICKHOUSE_HOST` | `clickhouse` | ClickHouse server host |
| `CLICKHOUSE_PORT` | `8123` | ClickHouse server port |
| `CLICKHOUSE_USER` | `default` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | `` | ClickHouse password |
| `CLICKHOUSE_DATABASE` | `default` | ClickHouse database name |
| `CLICKHOUSE_SCHEMA` | `default` | ClickHouse schema |
| `DBT_PROFILES_DIR` | `/app` | dbt profiles directory |

### dbt Configuration

The project uses dbt with ClickHouse adapter. Key configuration files:

- `dbt_project.yml`: Project configuration and settings
- `profiles.yml`: Database connection profiles
- `models/`: SQL models for data transformation

## Usage

### Running Locally

```bash
# Run all models
dbt run

# Run specific models
dbt run --select gold

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve
```

### Running with Docker Compose

From the Infrastructure directory:
```bash
# Start all services
docker-compose up -d

# Run Uranus dbt models
docker-compose up uranus

# Or run in detached mode
docker-compose up -d uranus
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t uranus:latest .
docker run --network packetpulse_network uranus:latest
```

## Data Models

### Gold Layer Models

#### active_sessions
Real-time active delivery sessions with current status and location:
```sql
-- Tracks currently active delivery sessions
-- Includes real-time location and status information
-- Used for live dashboard display
```

#### session_summary
Aggregated session statistics and metrics:
```sql
-- Session-level aggregations and KPIs
-- Duration, distance, and performance metrics
-- Historical analysis and reporting
```

#### fleet_summary
Fleet-wide analytics and performance metrics:
```sql
-- Fleet-level aggregations and insights
-- Vehicle utilization and performance
-- Operational efficiency metrics
```

#### kpi_aggregates
Key Performance Indicators for business metrics:
```sql
-- Business KPIs and metrics
-- Delivery success rates and times
-- Customer satisfaction indicators
```

#### users
User management and authentication data:
```sql
-- User profiles and authentication
-- Dashboard access control
-- User activity tracking
```

### Model Dependencies

```
bronze (Neptune) → silver (Jupiter) → gold (Uranus)
     ↓                    ↓              ↓
  raw_data         structured_data   business_models
```

## Data Flow

### Gold Layer Process

1. **Data Ingestion**: Reads from ClickHouse tables created by Jupiter
2. **Business Logic**: Applies business rules and calculations
3. **Aggregation**: Creates summary tables and KPIs
4. **Quality Checks**: Runs data quality tests and validation
5. **Documentation**: Generates model documentation and lineage

## Integration

Uranus integrates with the PacketPulse platform:
- **Input**: Structured data from ClickHouse (via Jupiter)
- **Processing**: Business logic and aggregation
- **Output**: Business-ready models for Mercury dashboard
- **Quality**: Data validation and testing
