# ──────────────────────────────────────────────────────────────
# Jupiter/main.py
# PyFlink streaming job: Kafka → ClickHouse (Silver layer).
# Now auto‑creates the ClickHouse sink table so you don’t
# have to run any manual DDL.
# ──────────────────────────────────────────────────────────────

import os
import time
from clickhouse_driver import Client
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import (StreamTableEnvironment, EnvironmentSettings)

# ---------------------------------------------------------------------------
# Configuration – override with env vars when you run docker compose.
# ---------------------------------------------------------------------------


KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
KAFKA_TOPIC     = os.getenv("KAFKA_TOPIC", "sessions-topic")
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "clickhouse")
CLICKHOUSE_PORT = os.getenv("CLICKHOUSE_PORT", "9000")
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_DB   = os.getenv("CLICKHOUSE_DATABASE", "default")
CLICKHOUSE_TAB  = os.getenv("CLICKHOUSE_TABLE", "session_movements")
CLICKHOUSE_URL  = f"jdbc:clickhouse://{CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}/{CLICKHOUSE_DB}"

# ---------------------------------------------------------------------------
# Helper: create the sink table if it doesn’t exist yet.
# Retries while ClickHouse container starts up.
# ---------------------------------------------------------------------------

def ensure_clickhouse_table(max_retries: int = 10, delay: int = 2):
    ddl = f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_TAB} (
          session_id   String,
          vehicle_id   String,
          order_id     String,
          status       String,
          event_time   DateTime64(3),
          start_lat    Float64,
          start_lon    Float64,
          end_lat      Float64,
          end_lon      Float64,
          current_lat  Float64,
          current_lon  Float64
        ) ENGINE = MergeTree
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (session_id, event_time)
    """

    for attempt in range(1, max_retries + 1):
        try:
            client = Client(host=CLICKHOUSE_HOST, port=int(CLICKHOUSE_PORT), user=CLICKHOUSE_USER)
            client.execute(ddl)
            print("✓ ClickHouse table ready →", CLICKHOUSE_TAB)
            return
        except Exception as exc:
            print(f"[{attempt}/{max_retries}] ClickHouse not ready – {exc}")
            time.sleep(delay)
    raise RuntimeError("Failed to create ClickHouse table after retries")

# Call it right away — before Flink starts writing.
ensure_clickhouse_table()

# ---------------------------------------------------------------------------
# Build the Flink environments.
# ---------------------------------------------------------------------------

env_settings = EnvironmentSettings.in_streaming_mode()
exec_env = StreamExecutionEnvironment.get_execution_environment()
exec_env.set_parallelism(1)

table_env = StreamTableEnvironment.create(exec_env, environment_settings=env_settings)

# ---------------------------------------------------------------------------
# Define Kafka source & ClickHouse sink with PyFlink DDL.
# ---------------------------------------------------------------------------

source_ddl = f"""
CREATE TABLE kafka_sessions (
    session_id   STRING,
    vehicle_id   STRING,
    order_id     STRING,
    status       STRING,
    event_time   TIMESTAMP_LTZ(3),
    start_lat    DOUBLE,
    start_lon    DOUBLE,
    end_lat      DOUBLE,
    end_lon      DOUBLE,
    current_lat  DOUBLE,
    current_lon  DOUBLE,
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = '{KAFKA_TOPIC}',
    'properties.bootstrap.servers' = '{KAFKA_BOOTSTRAP}',
    'format' = 'json',
    'json.timestamp-format.standard' = 'ISO-8601',
    'scan.startup.mode' = 'earliest-offset'
)
"""

sink_ddl = f"""
CREATE TABLE clickhouse_sessions (
    session_id    STRING,
    vehicle_id    STRING,
    order_id      STRING,
    status        STRING,
    event_time    TIMESTAMP_LTZ(3),
    start_lat     DOUBLE,
    start_lon     DOUBLE,
    end_lat       DOUBLE,
    end_lon       DOUBLE,
    current_lat   DOUBLE,
    current_lon   DOUBLE
) WITH (
    'connector' = 'jdbc',
    'url' = '{CLICKHOUSE_URL}',
    'table-name' = '{CLICKHOUSE_TAB}',
    'driver' = 'com.clickhouse.jdbc.ClickHouseDriver',
    'username' = '{CLICKHOUSE_USER}',
    'sink.buffer-flush.max-rows' = '500',
    'sink.buffer-flush.interval' = '2s',
    'sink.parallelism' = '2'
)
"""

insert_sql = """
INSERT INTO clickhouse_sessions
SELECT
  session_id,
  vehicle_id,
  order_id,
  status,
  event_time,
  start_lat,
  start_lon,
  end_lat,
  end_lon,
  current_lat,
  current_lon
FROM kafka_sessions
"""

# ---------------------------------------------------------------------------
# Register tables & start pipeline.
# ---------------------------------------------------------------------------

table_env.execute_sql(source_ddl)
table_env.execute_sql(sink_ddl)

table_env.execute_sql(insert_sql)

table_env.execute("JupiterKafkaToClickHouse")
