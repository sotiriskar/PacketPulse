# PacketPulse Infrastructure

This directory contains the infrastructure setup for PacketPulse, using Docker and Kafka.

## Components

- **Kafka**: Message broker for handling high-throughput delivery data
- **Zookeeper**: Required by Kafka for coordination
- **Venus API**: WebSocket API that receives delivery data and sends it to Kafka
- **Mars Simulator**: Simulates packet deliveries and sends data to Venus API

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Infrastructure

1. From the project root, run:

```bash
docker-compose -f Infrastructure/docker-compose.yml up -d
```

2. Access the services:
   - Venus API: http://localhost:8000

### Stopping the Infrastructure

```bash
docker-compose -f Infrastructure/docker-compose.yml down
```

To remove all data volumes:

```bash
docker-compose -f Infrastructure/docker-compose.yml down -v
```

## Scaling

To scale the Venus API for higher throughput:

```bash
docker-compose -f Infrastructure/docker-compose.yml up -d --scale venus-api=3
```

## Monitoring

- **Logs**: View container logs with `docker-compose -f Infrastructure/docker-compose.yml logs -f [service-name]`

## Performance Considerations

The current setup can handle high throughput by:

1. Using Kafka for message buffering and processing
2. Multiple workers in Venus API
3. Connection pooling and backpressure handling
4. Optimized serialization and compression

For production environments, consider:
- Increasing Kafka partitions
- Adding more Venus API instances
- Implementing proper monitoring
- Setting up a consumer service for the Kafka messages 
