# Uranus - Data Transformation (dbt)

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

### Transformation Pipeline

```
ClickHouse Tables → dbt Models → Business Views → Mercury Dashboard
```

## Development

### Project Structure

```
Uranus/
├── analyses/              # Ad-hoc analyses
├── macros/               # Reusable SQL macros
├── models/               # dbt models
│   └── gold/            # Gold layer models
│       ├── active_sessions.sql
│       ├── fleet_summary.sql
│       ├── kpi_aggregates.sql
│       ├── schema.yml   # Model documentation
│       ├── session_summary.sql
│       └── users.sql
├── seeds/               # Static data files
├── snapshots/           # Type 2 SCD tracking
├── tests/               # Custom data tests
├── dbt_project.yml      # Project configuration
├── profiles.yml         # Database connections
├── Dockerfile
├── requirements.txt
└── README.md
```

### Adding New Models

1. **Create SQL Model**: Add new `.sql` file in `models/gold/`
2. **Document Model**: Add model definition in `schema.yml`
3. **Add Tests**: Implement data quality tests
4. **Update Dependencies**: Configure model dependencies

### Example Model

```sql
-- models/gold/new_kpi.sql
{{ config(materialized='table') }}

SELECT 
    session_id,
    vehicle_id,
    AVG(speed) as avg_speed,
    COUNT(*) as total_events
FROM {{ ref('session_movements') }}
GROUP BY session_id, vehicle_id
```

## Testing

### Data Quality Tests

```bash
# Run all tests
dbt test

# Run specific model tests
dbt test --select active_sessions

# Run custom tests
dbt test --select test_type:generic
```

### Test Examples

```yaml
# schema.yml
models:
  - name: active_sessions
    tests:
      - not_null:
          column_name: session_id
      - unique:
          column_name: session_id
      - accepted_values:
          column_name: status
          values: ['started', 'en_route', 'completed']
```

## Documentation

### Generating Documentation

```bash
# Generate documentation
dbt docs generate

# Serve documentation locally
dbt docs serve
```

### Documentation Features

- **Model Lineage**: Visual representation of data dependencies
- **Column Descriptions**: Detailed field documentation
- **Test Results**: Data quality test outcomes
- **Business Context**: Model purpose and usage

## Performance

### Optimization Features

- **Incremental Models**: Efficient processing of new data only
- **Materialized Views**: Optimized table structures for queries
- **Partitioning**: Strategic data partitioning for performance
- **Indexing**: Optimized ClickHouse table indexes

### Monitoring

- **Model Execution**: Track model run times and success rates
- **Data Freshness**: Monitor data update frequency
- **Test Results**: Track data quality metrics
- **Resource Usage**: Monitor ClickHouse performance

## Troubleshooting

### Common Issues

1. **ClickHouse Connection Failed**: Verify database connectivity
2. **Model Failures**: Check SQL syntax and dependencies
3. **Test Failures**: Investigate data quality issues
4. **Performance Issues**: Optimize model queries and materialization

### Debug Mode

Enable debug logging:
```bash
export DBT_LOG_LEVEL=debug
dbt run --log-level debug
```

## Integration

Uranus integrates with the PacketPulse platform:
- **Input**: Structured data from ClickHouse (via Jupiter)
- **Processing**: Business logic and aggregation
- **Output**: Business-ready models for Mercury dashboard
- **Quality**: Data validation and testing

## Gold Layer Principles

This implementation follows gold layer best practices:
- **Business Logic**: Implement business rules and calculations
- **Data Quality**: Ensure data accuracy and consistency
- **Performance**: Optimize for analytical queries
- **Documentation**: Maintain comprehensive model documentation
