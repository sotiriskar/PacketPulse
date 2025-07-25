SELECT
    -- IDs & latest movement status
    s.session_id AS session_id,
    s.vehicle_id AS vehicle_id,
    s.order_id AS order_id,
    mov.last_status AS status,

    -- timestamps
    toTimeZone(s.event_started, 'UTC')                                                                                   AS start_time,
    toTimeZone(
      if(o.status = 'completed', o.completed_at, mov.last_tsp),
      'UTC'
    )                                                                                                                    AS end_time,

    -- duration in seconds
    dateDiff(
      'second',
      toTimeZone(s.event_started, 'UTC'),
      toTimeZone(
        if(o.status = 'completed', o.completed_at, mov.last_tsp),
        'UTC'
      )
    )                                                                                                                    AS duration_seconds,

    -- total distance in KM, rounded to 2 decimals
    round(
      greatCircleDistance(
        s.start_lon, s.start_lat,
        if(o.status = 'completed', s.end_lon, mov.last_lon),
        if(o.status = 'completed', s.end_lat, mov.last_lat)
      ) / 1000
    , 2)                                                                                                                  AS total_distance_km,

    -- average speed in KM/H, rounded to 2 decimals
    round(
      (
        greatCircleDistance(
          s.start_lon, s.start_lat,
          if(o.status = 'completed', s.end_lon, mov.last_lon),
          if(o.status = 'completed', s.end_lat, mov.last_lat)
        ) / 1000
      )
      / nullIf(
          dateDiff(
            'second',
            toTimeZone(s.event_started, 'UTC'),
            toTimeZone(
              if(o.status = 'completed', o.completed_at, mov.last_tsp),
              'UTC'
            )
          ),
          0
      )
      * 3600
    , 2)                                                                                                                  AS avg_speed_kmh

FROM default.sessions AS s

-- we still join orders to detect 'completed' for end‑time logic
LEFT JOIN default.orders AS o
  ON s.order_id = o.order_id

-- pull each session's latest movement timestamp, coords and status
LEFT JOIN (
  SELECT
    session_id,
    max(event_tsp)                         AS last_tsp,
    argMax(current_lat,  event_tsp)        AS last_lat,
    argMax(current_lon,  event_tsp)        AS last_lon,
    argMax(status,       event_tsp)        AS last_status
  FROM default.session_movements
  GROUP BY session_id
) AS mov
  ON s.session_id = mov.session_id

-- only include sessions that are completed or have movements
WHERE
     (o.status = 'completed')
  OR (mov.last_tsp IS NOT NULL)

-- drop zero‑length trips
  AND dateDiff(
        'second',
        toTimeZone(s.event_started, 'UTC'),
        toTimeZone(
          if(o.status = 'completed', o.completed_at, mov.last_tsp),
          'UTC'
        )
      ) > 0
