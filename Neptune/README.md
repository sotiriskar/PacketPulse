# Neptune Service

Neptune is a Kafka consumer service that reads messages from a specified Kafka topic and prints them to the console. It's designed to work with the PacketPulse ecosystem, consuming messages produced by other services.

## Features

- Consumes messages from a configured Kafka topic
- Pretty prints JSON messages to console
- Configurable through environment variables
- Graceful shutdown on interrupt

## Configuration

The service can be configured using the following environment variables:

- `KAFKA_BOOTSTRAP_SERVERS`: Kafka broker addresses (default: "localhost:9092")
- `KAFKA_TOPIC`: Topic to consume messages from (default: "sessions")
- `KAFKA_CONSUMER_GROUP`: Consumer group ID (default: "neptune")

## Running the Service

### Using Docker

```bash
docker build -t neptune -f Neptune/Dockerfile .
docker run -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 neptune
```

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python main.py
``` 