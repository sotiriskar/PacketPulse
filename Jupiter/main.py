# Jupiter/main.py
import os
import time
import json
import math
import clickhouse_connect
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.serialization import SimpleStringSchema
from pyflink.datastream.connectors import FlinkKafkaConsumer
from pyflink.datastream.functions import MapFunction

# ---------------------------------------------------------------------------
# Configuration – override with env vars if you like
# ---------------------------------------------------------------------------

KAFKA_BOOTSTRAP   = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
KAFKA_TOPIC       = os.getenv("KAFKA_TOPIC", "sessions-topic")

CLICKHOUSE_HOST   = os.getenv("CLICKHOUSE_HOST", "clickhouse")
CLICKHOUSE_PORT   = os.getenv("CLICKHOUSE_PORT", "8123")
CLICKHOUSE_USER   = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_DB     = os.getenv("CLICKHOUSE_DATABASE", "default")

TAB_MOVEMENTS     = os.getenv("CLICKHOUSE_TABLE_MOVEMENTS", "session_movements")
TAB_EVENTS        = os.getenv("CLICKHOUSE_TABLE_EVENTS",    "session_events")
TAB_BASE          = os.getenv("CLICKHOUSE_TABLE_BASE",      "sessions_base")


# ---------------------------------------------------------------------------
# Helper: create ALL three tables if they don't exist yet
# ---------------------------------------------------------------------------
def ensure_clickhouse_tables(max_retries: int = 10, delay: int = 2):
    ddl_statements = [

        # 1️⃣ immutable session header ------------------------------
        f"""
        CREATE TABLE IF NOT EXISTS {TAB_BASE} (
          session_id    String,
          vehicle_id    String,
          order_id      String,
          event_started DateTime64(3),
          start_lat     Float64,
          start_lon     Float64,
          end_lat       Float64,
          end_lon       Float64
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(event_started)
        ORDER BY session_id
        """,

        # 2️⃣ every status change -----------------------------------
        f"""
        CREATE TABLE IF NOT EXISTS {TAB_EVENTS} (
          session_id String,
          event_time DateTime64(3),
          status     String
        )
        ENGINE = ReplacingMergeTree(event_time)
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (session_id, event_time)
        """,

        # 3️⃣ every GPS ping ----------------------------------------
        f"""
        CREATE TABLE IF NOT EXISTS {TAB_MOVEMENTS} (
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
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(event_time)
        ORDER BY (session_id, event_time)
        """
    ]

    for attempt in range(1, max_retries + 1):
        try:
            print(f"[{attempt}/{max_retries}] Attempting to connect to ClickHouse at {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}...")
            client = clickhouse_connect.get_client(
                host=CLICKHOUSE_HOST,
                port=int(CLICKHOUSE_PORT),
                user=CLICKHOUSE_USER,
                database=CLICKHOUSE_DB
            )
            print(f"[{attempt}/{max_retries}] Successfully connected to ClickHouse!")
            
            for i, ddl in enumerate(ddl_statements, 1):
                print(f"[{attempt}/{max_retries}] Creating table {i}/3...")
                client.command(ddl)
                print(f"[{attempt}/{max_retries}] Table {i}/3 created successfully!")
            
            print("✅ ClickHouse tables ready.")
            return
        except Exception as exc:
            print(f"[{attempt}/{max_retries}] ClickHouse not ready – {exc}")
            if attempt < max_retries:
                print(f"Waiting {delay} seconds before retry...")
                time.sleep(delay)
            else:
                print("❌ Failed to create ClickHouse tables after all retries")
                raise

# Run table creation before Flink starts
print("🚀 Starting Jupiter service...")
ensure_clickhouse_tables()

# ---------------------------------------------------------------------------
# Sink function: one record ➔ three inserts
# ---------------------------------------------------------------------------
class ClickHouseSink(MapFunction):
    def __init__(self):
        pass

    def open(self, runtime_context):
        print("🔧 Initializing ClickHouse client...")
        self.client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=int(CLICKHOUSE_PORT),
            user=CLICKHOUSE_USER,
            database=CLICKHOUSE_DB
        )
        # track which sessions we've already stored in sessions_base
        self.seen_sessions = set()
        print("✅ ClickHouse client initialised")

    def map(self, record):
        # raw Kafka message → dict
        data = json.loads(record) if isinstance(record, str) else record

        # handy shortcuts
        sid   = data.get('session_id', '')
        vid   = data.get('vehicle_id', '')
        oid   = data.get('order_id', '')
        stat  = data.get('status', '')
        ts_iso = data.get('timestamp', '')          # e.g. "2025-07-21T18:30:15.734790"
        # ClickHouse likes 'YYYY‑MM‑DD HH:MM:SS.mmm'
        ts_sql = ts_iso.replace('T', ' ')[:26]      # trim to microseconds

        # ------------------------------------------------------------------
        # 1️⃣  sessions_base (first message only, usually status='started')
        # ------------------------------------------------------------------
        if sid and sid not in self.seen_sessions and stat == 'started':
            base_row = [(
                sid,
                vid,
                oid,
                ts_sql,
                float(data.get('start_lat', 0)),
                float(data.get('start_lon', 0)),
                float(data.get('end_lat', 0)),
                float(data.get('end_lon', 0))
            )]
            try:
                self.client.insert(TAB_BASE, base_row)
                self.seen_sessions.add(sid)
                print(f"➕ sessions_base row inserted for {sid}")
            except Exception as e:
                print(f"⚠️  sessions_base insert failed: {e}")

        # ------------------------------------------------------------------
        # 2️⃣  session_events (every message)
        # ------------------------------------------------------------------
        event_row = [(sid, ts_sql, stat)]
        try:
            self.client.insert(TAB_EVENTS, event_row)
        except Exception as e:
            print(f"⚠️  session_events insert failed: {e}")

        # ------------------------------------------------------------------
        # 3️⃣  session_movements (every message)
        # ------------------------------------------------------------------
        movement_row = [(
            sid,
            vid,
            oid,
            stat,
            ts_sql,
            float(data.get('start_lat', 0)),
            float(data.get('start_lon', 0)),
            float(data.get('end_lat', 0)),
            float(data.get('end_lon', 0)),
            float(data.get('current_lat', 0)),
            float(data.get('current_lon', 0))
        )]
        try:
            self.client.insert(TAB_MOVEMENTS, movement_row)
        except Exception as e:
            print(f"⚠️  session_movements insert failed: {e}")

        # hand the record downstream if needed
        return record

# ---------------------------------------------------------------------------
# Flink job definition
# ---------------------------------------------------------------------------
print("🔧 Setting up Flink environment...")
env = StreamExecutionEnvironment.get_execution_environment()
env.set_parallelism(1)                     # tweak for prod

print("🔧 Creating Kafka consumer...")
kafka_consumer = FlinkKafkaConsumer(
    topics=KAFKA_TOPIC,
    deserialization_schema=SimpleStringSchema(),
    properties={
        'bootstrap.servers': KAFKA_BOOTSTRAP,
        'group.id': 'jupiter-consumer-group'
    }
)

print("🔧 Setting up data stream...")
stream = env.add_source(kafka_consumer)
stream.map(ClickHouseSink()).name("clickhouse-sink")

print("🚀 Launching Flink job (Jupiter‑ClickHouse‑Pipeline)…")
env.execute("Jupiter-ClickHouse-Pipeline")
