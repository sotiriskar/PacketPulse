{{ 
  config(
    materialized = "view",
    settings = {
      "enable_time_time64_type": 1
    }
  ) 
}}

WITH latest_movement AS (
  SELECT
    session_id,
    event_tsp AS last_update_time,
    current_lat,
    current_lon,
    status
  FROM session_movements
  ORDER BY session_id, event_tsp DESC
  LIMIT 1 BY session_id
),

final AS (
  SELECT
    s.session_id,
    s.vehicle_id,
    s.order_id,
    lm.status       AS order_status,
    s.event_started AS start_time,
    lm.last_update_time,

    -- distance remaining (km)
    round(
      greatCircleDistance(
        lm.current_lat, lm.current_lon,
        s.end_lat,      s.end_lon
      ) / 1000
    , 2) AS distance_to_destination_km,

    -- elapsed time as HH:MM:SS duration
    toTime64(
      dateDiff('second', s.event_started, lm.last_update_time)
    , 0) AS elapsed_time,

    -- avg speed (km/h)
    round(
      (
        greatCircleDistance(
          lm.current_lat, lm.current_lon,
          s.start_lat,    s.start_lon
        )
        / greatest(
            dateDiff('second', s.event_started, lm.last_update_time),
            1
          )
      ) * 3.6
    , 2) AS avg_speed_kmh,

    -- ETA as HH:MM:SS duration
    toTime64(
      ceil(
        (distance_to_destination_km * 1000)
        / greatest(avg_speed_kmh/3.6, 0.1)
      )
    , 0) AS eta

  FROM sessions s
  JOIN latest_movement lm USING (session_id)
  WHERE lm.status IN ('started', 'en_route')
)

SELECT *
FROM final
