# Use a lightweight Python image and install Flink and Java
FROM python:3.10-slim

# Install Java (for PyFlink) and other tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      openjdk-17-jdk \
      build-essential \
      curl \
      unzip \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
ENV PATH="${JAVA_HOME}/bin:${PATH}"
ENV LD_LIBRARY_PATH="${JAVA_HOME}/lib:${LD_LIBRARY_PATH}"

# Download and unpack Flink
ENV FLINK_VERSION=1.20.2 \
    FLINK_SCALA=2.12
RUN curl -SL https://downloads.apache.org/flink/flink-${FLINK_VERSION}/flink-${FLINK_VERSION}-bin-scala_${FLINK_SCALA}.tgz \
    | tar -xz -C /opt \
    && mv /opt/flink-${FLINK_VERSION} /opt/flink

# Add Flink to PATH
ENV PATH="/opt/flink/bin:/opt/flink/lib:${PATH}"

# Copy application files
WORKDIR /opt/jupiter
COPY Jupiter/requirements.txt Jupiter/main.py ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Default environment variables
ENV KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
    KAFKA_TOPIC=trips_topic \
    CLICKHOUSE_HOST=localhost \
    CLICKHOUSE_DB=default \
    FLINK_HOME=/opt/flink

# Entrypoint: submit PyFlink job
ENTRYPOINT ["flink", "run", "-py", "/opt/jupiter/main.py"]
