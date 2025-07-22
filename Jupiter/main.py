import os
import time
import json
import clickhouse_connect
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.serialization import SimpleStringSchema
from pyflink.datastream.connectors import FlinkKafkaConsumer
from pyflink.datastream.functions import MapFunction

# ---------------------------------------------------------------------------
# Configuration – override with env vars when you run docker compose.
# ---------------------------------------------------------------------------

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
KAFKA_TOPIC     = os.getenv("KAFKA_TOPIC", "sessions-topic")
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "clickhouse")
CLICKHOUSE_PORT = os.getenv("CLICKHOUSE_PORT", "8123")
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_DB   = os.getenv("CLICKHOUSE_DATABASE", "default")
CLICKHOUSE_TAB  = os.getenv("CLICKHOUSE_TABLE", "session_movements")

# ---------------------------------------------------------------------------
# Helper: create the sink table if it doesn't exist yet.
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
            # Use clickhouse-connect client
            client = clickhouse_connect.get_client(
                host=CLICKHOUSE_HOST,
                port=int(CLICKHOUSE_PORT),
                user=CLICKHOUSE_USER,
                database=CLICKHOUSE_DB
            )
            
            # Execute the DDL
            client.command(ddl)
            print("✓ ClickHouse table ready →", CLICKHOUSE_TAB)
            return
        except Exception as exc:
            print(f"[{attempt}/{max_retries}] ClickHouse not ready – {exc}")
            time.sleep(delay)
    raise RuntimeError("Failed to create ClickHouse table after retries")

# Call it right away — before Flink starts writing.
ensure_clickhouse_table()

# ---------------------------------------------------------------------------
# Custom sink function to write to ClickHouse
# ---------------------------------------------------------------------------

class ClickHouseSink(MapFunction):
    def __init__(self):
        self.client = None
    
    def open(self, runtime_context):
        """Initialize ClickHouse client when the function opens"""
        self.client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=int(CLICKHOUSE_PORT),
            user=CLICKHOUSE_USER,
            database=CLICKHOUSE_DB
        )
        print("✅ ClickHouse client initialized")
    
    def map(self, record):
        """Process a single record and write to ClickHouse"""
        try:
            print(f"🔍 Processing record: {record[:100]}...")
            
            # Parse the JSON record
            if isinstance(record, str):
                record_data = json.loads(record)
            else:
                record_data = record
            
            print(f"📊 Parsed data - session_id: {record_data.get('session_id', 'unknown')}")
            
            # Prepare data for ClickHouse as a list of tuples (correct format)
            data = [(
                record_data.get('session_id', ''),
                record_data.get('vehicle_id', ''),
                record_data.get('order_id', ''),
                record_data.get('status', ''),
                record_data.get('timestamp', '').replace('T', ' '),
                float(record_data.get('start_lat', 0)),
                float(record_data.get('start_lon', 0)),
                float(record_data.get('end_lat', 0)),
                float(record_data.get('end_lon', 0)),
                float(record_data.get('current_lat', 0)),
                float(record_data.get('current_lon', 0))
            )]
            
            print(f"💾 Inserting data into ClickHouse: {data[0]}")
            
            # Insert data into ClickHouse
            self.client.insert(CLICKHOUSE_TAB, data)
            print(f"✅ Successfully inserted record: {record_data.get('session_id', 'unknown')}")
            
        except Exception as e:
            print(f"❌ Error processing record: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # Return the original record for downstream processing
        return record

# ---------------------------------------------------------------------------
# Build the Flink environments.
# ---------------------------------------------------------------------------

exec_env = StreamExecutionEnvironment.get_execution_environment()
exec_env.set_parallelism(1)

# ---------------------------------------------------------------------------
# Create Kafka consumer and process stream
# ---------------------------------------------------------------------------

try:
    print("🔧 Setting up Kafka consumer...")
    
    # Create Kafka consumer with correct API
    kafka_consumer = FlinkKafkaConsumer(
        topics=KAFKA_TOPIC,
        deserialization_schema=SimpleStringSchema(),
        properties={
            'bootstrap.servers': KAFKA_BOOTSTRAP,
            'group.id': 'jupiter-consumer',
            'auto.offset.reset': 'earliest'
        }
    )
    
    # Create the stream
    stream = exec_env.add_source(kafka_consumer)
    
    print("✅ Kafka consumer created")
    
    # Apply the ClickHouse sink
    stream.map(ClickHouseSink()).name("clickhouse-sink")
    
    print("🚀 Starting streaming job...")
    exec_env.execute("Jupiter-ClickHouse-Pipeline")
    print("✅ Streaming job started")
    
except Exception as e:
    print(f"❌ Error in Flink job: {e}")
    import traceback
    traceback.print_exc()
    raise
