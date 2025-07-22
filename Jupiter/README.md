# Project Jupiter

**Real‐time Silver ingestion** from Kafka → ClickHouse via PyFlink.

## 🔧 Prerequisites

- Docker & Docker Compose  
- A running Kafka cluster with topic `trips_topic`  
- A running ClickHouse server (default at `clickhouse-server:8123`)  
- (Optional) S3/HDFS for Flink checkpointing

## 📦 Build

```bash
git clone https://your.git.repo/project-jupiter.git
cd project-jupiter

# build the Docker image
docker build -t project-jupiter:latest .
