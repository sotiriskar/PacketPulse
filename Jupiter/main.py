from pyflink.table import EnvironmentSettings, StreamTableEnvironment, DataTypes
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table.udf import udf
import math
import os


# 1) Haversine UDF for distance in meters
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c * 1000

@udf(input_types=[DataTypes.DOUBLE(), DataTypes.DOUBLE(), DataTypes.DOUBLE(), DataTypes.DOUBLE()],
     result_type=DataTypes.DOUBLE())
def haversine_udf(lat1, lon1, lat2, lon2):
    if lat1 is None:
        return 0.0
    return haversine(lat1, lon1, lat2, lon2)


def main():
    # Environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(int(os.getenv('FLINK_PARALLELISM', '4')))

    settings = EnvironmentSettings.new_instance().in_streaming_mode().build()
    t_env = StreamTableEnvironment.create(env, environment_settings=settings)

    # Register UDF
    t_env.create_temporary_system_function('haversine', haversine_udf)

    # Source: Kafka
    t_env.execute_sql(f"""
    CREATE TABLE kafka_trips_raw (
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
      current_lon   DOUBLE,
      WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
    ) WITH (
      'connector' = 'kafka',
      'topic' = '{os.getenv('KAFKA_TOPIC')}',
      'properties.bootstrap.servers' = '{os.getenv('KAFKA_BOOTSTRAP_SERVERS')}',
      'format' = 'json',
      'json.timestamp-format.standard' = 'ISO-8601',
      'json.fail-on-missing-field' = 'false'
    )
    """)

    # Sinks: ClickHouse
    clickhouse_url = f"jdbc:clickhouse://{os.getenv('CLICKHOUSE_HOST')}:8123/{os.getenv('CLICKHOUSE_DB')}"
    common_props = "'driver' = 'ru.yandex.clickhouse.ClickHouseDriver'"

    t_env.execute_sql(f"""
    CREATE TABLE ch_sessions_base (
      session_id     STRING,
      vehicle_id     STRING,
      order_id       STRING,
      event_started  TIMESTAMP_LTZ(3),
      start_lat      DOUBLE,
      start_lon      DOUBLE,
      end_lat        DOUBLE,
      end_lon        DOUBLE
    ) WITH (
      'connector' = 'jdbc',
      'url' = '{clickhouse_url}',
      'table-name' = 'silver.sessions_base',
      {common_props}
    )
    """)

    t_env.execute_sql(f"""
    CREATE TABLE ch_session_events (
      session_id  STRING,
      event_time  TIMESTAMP_LTZ(3),
      status      STRING
    ) WITH (
      'connector' = 'jdbc',
      'url' = '{clickhouse_url}',
      'table-name' = 'silver.session_events',
      {common_props}
    )
    """)

    t_env.execute_sql(f"""
    CREATE TABLE ch_session_movements (
      session_id     STRING,
      event_time     TIMESTAMP_LTZ(3),
      current_lat    DOUBLE,
      current_lon    DOUBLE,
      distance_delta DOUBLE
    ) WITH (
      'connector' = 'jdbc',
      'url' = '{clickhouse_url}',
      'table-name' = 'silver.session_movements',
      {common_props}
    )
    """)

    # Inserts
    t_env.execute_sql("""
    INSERT INTO ch_sessions_base
    SELECT
      session_id,
      vehicle_id,
      order_id,
      event_time AS event_started,
      start_lat,
      start_lon,
      end_lat,
      end_lon
    FROM kafka_trips_raw
    WHERE status = 'started'
    """)

    t_env.execute_sql("""
    INSERT INTO ch_session_events
    SELECT
      session_id,
      event_time,
      status
    FROM kafka_trips_raw
    WHERE status IS NOT NULL
    """)

    t_env.execute_sql("""
    INSERT INTO ch_session_movements
    SELECT
      session_id,
      event_time,
      current_lat,
      current_lon,
      haversine(
        LAG(current_lat) OVER w,
        LAG(current_lon) OVER w,
        current_lat,
        current_lon
      ) AS distance_delta
    FROM kafka_trips_raw
    WINDOW w AS (
      PARTITION BY session_id
      ORDER BY event_time
      ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
    )
    """)

    # Start execution
    env.execute("Project Jupiter - Silver Ingestion")

if __name__ == '__main__':
    main()
