WITH

-- 1) Summarize each session a single time
session_summary AS (
    SELECT
        s.session_id,
        s.vehicle_id,
        -- last movement timestamp in the session
        MAX(m.event_tsp) AS last_updated,
        -- is any movement in this session 'started' or 'en_route'?
        MAX(m.status IN ('started','en_route')) AS is_active,
        -- compute the great‑circle distance once per session
        greatCircleDistance(
            MIN(m.current_lat),
            MIN(m.current_lon),
            MAX(m.current_lat),
            MAX(m.current_lon)
        ) / 1000 AS session_distance_km
    FROM default.sessions        AS s
    INNER JOIN default.session_movements AS m
        ON m.session_id = s.session_id
    GROUP BY
        s.session_id,
        s.vehicle_id
),

-- 2) Roll up per‑vehicle metrics from those session rows
vehicle_summary AS (
    SELECT
        ss.vehicle_id,
        MAX(ss.last_updated)         AS last_updated,
        MAX(ss.is_active)            AS is_active,
        COUNT(*)                     AS trips,
        SUM(ss.session_distance_km)  AS total_km
    FROM session_summary AS ss
    GROUP BY
        ss.vehicle_id
),

-- 3) Pick one first_seen per vehicle (here: the earliest)
vehicle_first_seen AS (
    SELECT
        vehicle_id,
        MIN(first_seen) AS first_seen
    FROM default.vehicles
    GROUP BY vehicle_id
)

-- 4) Final join: one row per vehicle
SELECT
    vfs.vehicle_id,
    vfs.first_seen,
    vs.last_updated,
    vs.is_active,
    vs.trips,
    -- round at the very end
    ROUND(vs.total_km, 2) AS total_km
FROM vehicle_first_seen AS vfs
LEFT JOIN vehicle_summary   AS vs
    ON vs.vehicle_id = vfs.vehicle_id
ORDER BY vfs.vehicle_id