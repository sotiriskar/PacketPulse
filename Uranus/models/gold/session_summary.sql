WITH trip_metrics AS (

    SELECT
        s.session_id,
        toTimeZone(s.event_started, 'UTC') AS start_time,
        toTimeZone(o.completed_at,  'UTC') AS end_time,

        dateDiff(
            'second',
            toTimeZone(s.event_started, 'UTC'),
            toTimeZone(o.completed_at,  'UTC')
        ) AS duration_seconds,

        -- CORRECTED: lon before lat
        greatCircleDistance(
            s.start_lon, s.start_lat,
            s.end_lon,   s.end_lat
        ) / 1000 AS total_distance_km

    FROM sessions s
    JOIN orders   o ON s.order_id = o.order_id
    WHERE o.status = 'completed'

)

SELECT
    session_id,
    start_time,
    end_time,
    duration_seconds,
    round(total_distance_km, 2)                                       AS total_distance_km,
    round(total_distance_km / nullIf(duration_seconds, 0) * 3600, 2) AS avg_speed_kmh
FROM trip_metrics
WHERE duration_seconds > 0
