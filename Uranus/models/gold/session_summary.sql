with session_status as (
  select
    session_id,
    status
  from session_movements
  order by session_id, event_tsp desc
  limit 1 by session_id
),

final as (
    select
    s.session_id as session_id,
    min(m.event_tsp) as start_time,
    max(m.event_tsp) as end_time,
    dateDiff('second', min(m.event_tsp), max(m.event_tsp)) as duration_seconds,
    round(greatCircleDistance(min(m.current_lat), min(m.current_lon), max(m.current_lat), max(m.current_lon)) / 1000, 2) as total_distance_km,
    round(
        (greatCircleDistance(min(m.current_lat), min(m.current_lon), max(m.current_lat), max(m.current_lon)) / 1000)
        / dateDiff('second', min(m.event_tsp), max(m.event_tsp)) * 3.6, 2
    ) as avg_speed_kmh
    from session_movements m
    join sessions s on s.session_id = m.session_id
    join session_status ss on ss.session_id = s.session_id
    where ss.status = 'completed'
    group by s.session_id
)

select * from final
