# ──────────────────────────────────────────────────────────────
# Jupiter/Dockerfile
# Flink 1.20.2 + Kafka connector 3.4.0‑1.20 + ClickHouse JDBC 0.9.0
# Uses **linux/amd64** platform so pip can download the pre‑built
# PyFlink wheels (they are not published for aarch64 yet).
# ──────────────────────────────────────────────────────────────

FROM --platform=linux/amd64 python:3.10-slim

# ---------- system dependencies ----------
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
           openjdk-17-jdk-headless wget ca-certificates bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV FLINK_VERSION=1.20.2 \
    SCALA_VERSION=2.12 \
    KAFKA_CONNECTOR_VERSION=3.4.0-1.20 \
    CLICKHOUSE_JDBC_VERSION=0.9.0 \
    JDBC_CONNECTOR_VERSION=3.3.0-1.20 \
    FLINK_HOME=/opt/flink
ENV PATH="$PATH:$FLINK_HOME/bin:$FLINK_HOME/opt"

# ---------- download Flink ----------
RUN wget -nv https://downloads.apache.org/flink/flink-${FLINK_VERSION}/flink-${FLINK_VERSION}-bin-scala_${SCALA_VERSION}.tgz \
    && tar -xzf flink-${FLINK_VERSION}-bin-scala_${SCALA_VERSION}.tgz -C /opt \
    && mv /opt/flink-${FLINK_VERSION} ${FLINK_HOME} \
    && rm flink-${FLINK_VERSION}-bin-scala_${SCALA_VERSION}.tgz

# ---------- add connectors ----------
RUN wget -nv https://repo1.maven.org/maven2/org/apache/flink/flink-connector-kafka/${KAFKA_CONNECTOR_VERSION}/flink-connector-kafka-${KAFKA_CONNECTOR_VERSION}.jar -O ${FLINK_HOME}/lib/flink-connector-kafka.jar \
    && wget -nv https://repo1.maven.org/maven2/com/clickhouse/clickhouse-jdbc/${CLICKHOUSE_JDBC_VERSION}/clickhouse-jdbc-${CLICKHOUSE_JDBC_VERSION}.jar -O ${FLINK_HOME}/lib/clickhouse-jdbc.jar \
    && wget -nv https://repo1.maven.org/maven2/org/apache/kafka/kafka-clients/3.4.0/kafka-clients-3.4.0.jar -O ${FLINK_HOME}/lib/kafka-clients.jar \
    && wget -nv https://repo1.maven.org/maven2/org/apache/flink/flink-connector-jdbc/${JDBC_CONNECTOR_VERSION}/flink-connector-jdbc-${JDBC_CONNECTOR_VERSION}.jar -O ${FLINK_HOME}/lib/flink-connector-jdbc.jar

# ---------- Python requirements ----------
COPY Jupiter/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# ---------- application code ----------
WORKDIR /usr/src/app
COPY Jupiter/main.py ./main.py

# ---------- entrypoint ----------
CMD start-cluster.sh & sleep 10 && python main.py
